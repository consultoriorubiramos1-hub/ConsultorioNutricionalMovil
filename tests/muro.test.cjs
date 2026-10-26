const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

// Contract fixtures and the small hook harness live only in tests.
process.env.TZ = "America/Mexico_City";
const fixture = (id = 1, liked = false, count = 5) => ({ id, title: "Publicación de prueba", likes_count: count, user_has_liked: liked });
const plain = (value) => JSON.parse(JSON.stringify(value));
const flush = () => new Promise(setImmediate);
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function api(data, status = 200) {
  return { ok: status < 400, status, json: async () => ({ ok: status < 400, data }) };
}

function setup() {
  const calls = [], opened = [], checked = [], routes = [];
  const timers = new Set();
  const slots = [];
  let slotIndex = 0, focusEffect, focusCleanup, token = "token", cleared = 0;
  let canOpen = true, openError = false;
  let response = async () => api([]);
  const native = { OS: "android" };
  const hooks = {
    useState(initial) {
      const index = slotIndex++;
      if (!slots[index]) slots[index] = { value: typeof initial === "function" ? initial() : initial };
      return [slots[index].value, (next) => { slots[index].value = typeof next === "function" ? next(slots[index].value) : next; }];
    },
    useRef(initial) {
      const index = slotIndex++;
      if (!slots[index]) slots[index] = { current: initial };
      return slots[index];
    },
    useCallback(callback, dependencies) {
      const index = slotIndex++;
      const previous = slots[index];
      if (!previous || !dependencies.every((value, i) => Object.is(value, previous.dependencies[i]))) {
        slots[index] = { callback, dependencies };
      }
      return slots[index].callback;
    },
  };
  const context = vm.createContext({
    Date, Intl, URL, AbortController,
    process: { env: { EXPO_PUBLIC_API_URL: "https://example.test/" } },
    setTimeout: (callback) => { timers.add(callback); return callback; },
    clearTimeout: (callback) => timers.delete(callback),
    fetch: async (...args) => { calls.push(args); return response(...args); },
  });
  const cache = new Map();
  function load(relative) {
    const filename = path.resolve(relative);
    if (cache.has(filename)) return cache.get(filename);
    const module = { exports: {} };
    const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    }).outputText;
    vm.runInContext("(function(require,module,exports){" + compiled + "\n})", context, { filename })(
      (id) => {
        if (id === "react") return hooks;
        if (id === "expo-router") return {
          router: { navigate: (route) => routes.push(route), replace: (route) => routes.push(route) },
          useFocusEffect: (callback) => { focusEffect = callback; },
        };
        if (id === "@/shared/session/session-token") return {
          getSessionToken: async () => token,
          clearSessionToken: async () => { token = null; cleared += 1; },
        };
        if (id === "react-native") return {
          Platform: native,
          Linking: {
            canOpenURL: async (url) => { checked.push(url); return canOpen; },
            openURL: async (url) => { if (openError) throw new Error("private native details"); opened.push(url); },
          },
        };
        if (id.startsWith(".")) return load(path.join(path.dirname(filename), id + ".ts"));
        throw new Error("Unexpected test import: " + id);
      }, module, module.exports,
    );
    cache.set(filename, module.exports);
    return module.exports;
  }
  const render = () => {
    slotIndex = 0;
    return load("src/modules/muro/viewmodels/use-muro-viewmodel.ts").useMuroViewModel();
  };
  return {
    calls, opened, checked, routes, timers, native, env: context.process.env,
    adapter: load("src/modules/muro/adapters/muro-adapter.ts"),
    format: load("src/modules/muro/utils/muro-format.ts"),
    likes: load("src/modules/muro/utils/muro-like.ts"),
    service: load("src/modules/muro/services/muro-service.ts"),
    links: load("src/modules/muro/services/external-link-service.ts"),
    respond: (body, status = 200) => { response = async () => ({ ok: status < 400, status, json: async () => body }); },
    fetch: (callback) => { response = callback; },
    setCanOpen: (value) => { canOpen = value; },
    setOpenError: (value) => { openError = value; },
    setToken: (value) => { token = value; },
    get cleared() { return cleared; },
    render,
    focus: () => { render(); focusCleanup = focusEffect(); },
    blur: () => { focusCleanup?.(); },
  };
}

test("post adapter handles nulls, translates fields and preserves literal multiline content without authors", () => {
  const { adapter } = setup();
  const content = "  Primera línea\n\n<script>texto literal</script>\n";
  const post = adapter.postsFromApi([{ ...fixture(), title: null, description: null, content, created_at: "2026-10-07T12:00:00Z", images: null, links: false, username: "not returned by mobile" }])[0];
  assert.equal(post.title, null);
  assert.equal(post.description, null);
  assert.equal(post.content, content);
  assert.equal(post.createdAt, "2026-10-07T12:00:00Z");
  assert.deepEqual(plain(post.images), []);
  assert.deepEqual(plain(post.links), []);
  assert.equal("username" in post, false);
  assert.equal("author" in post, false);
});

test("counts normalize numeric strings, reject invalid values and never become negative", () => {
  const { adapter } = setup();
  for (const [value, count] of [["5", 5], [" 2.9 ", 2], [-3, 0], ["-1", 0], [null, 0], ["NaN", 0], [Infinity, 0], ["", 0], [true, 0], ["0x10", 0]]) {
    assert.equal(adapter.postsFromApi([{ ...fixture(), likes_count: value }])[0].likesCount, count);
  }
  for (const [value, liked] of [[true, true], [false, false], ["true", true], ["false", false], [null, false], ["yes", false], [1, false]]) {
    assert.equal(adapter.postsFromApi([{ ...fixture(), user_has_liked: value }])[0].userHasLiked, liked);
  }
});

test("post IDs are positive safe integers, invalid rows are omitted and duplicates do not duplicate cards", () => {
  const { adapter, format } = setup();
  for (const value of [null, undefined, 0, -1, 1.5, "bad", "", "1.5", "0x10", true, Number.MAX_SAFE_INTEGER + 1]) assert.equal(format.positiveId(value), null);
  assert.equal(format.positiveId(" 2 "), 2);
  const posts = adapter.postsFromApi([null, {}, fixture(0), fixture(2), fixture("2"), fixture(1)]);
  assert.deepEqual(plain(posts.map((post) => post.id)), [2, 1]);
  assert.deepEqual(plain(adapter.postsFromApi([])), []);
  assert.throws(() => adapter.postsFromApi(null));
});

test("images and links sort by real order, tolerate missing fields and reject unsafe URLs", () => {
  const { adapter } = setup();
  const images = [
    { url: "https://example.test/second.png", order: "2" },
    { id: "9", url: "https://example.test/first.png", order: 0 },
    { url: "data:image/png;base64,bad", order: 1 },
    { url: "https://example.test/last.png", order: null }, null,
  ];
  const source = JSON.stringify(images);
  const result = adapter.postImagesFromApi(images);
  assert.deepEqual(plain(result.map((image) => image.url)), ["https://example.test/first.png", "https://example.test/second.png", "https://example.test/last.png"]);
  assert.equal(result[0].id, 9);
  assert.equal(result[2].order, null);
  assert.equal(JSON.stringify(images), source);
  const links = adapter.postLinksFromApi([{ url: "https://example.test/b", title: null, order: 1 }, { url: "https://example.test/a", title: " Más información ", order: "0" }, { url: "javascript:alert(1)" }]);
  assert.equal(links.length, 2);
  assert.equal(links[0].title, "Más información");
  assert.equal(links[1].title, null);
});

test("URLs only allow HTTP(S), reject credentials and arbitrary schemes, and hide queries in fallback labels", () => {
  const { format } = setup();
  for (const value of [null, "", "javascript:alert(1)", "data:text/html,bad", "file:///private", "intent://app", "ftp://example.test", "//example.test", "https://", "https://user:secret@example.test", "https://example.test/\nmalformed"]) {
    assert.equal(format.safeHttpUrl(value), null);
  }
  assert.equal(format.safeHttpUrl(" https://example.test/path "), "https://example.test/path");
  assert.equal(format.safeHttpUrl("http://example.test"), "http://example.test/");
  assert.equal(format.safeLinkLabel("https://example.test/path?signature=secret#private"), "example.test/path");
});

test("publication timestamps use the local date while date-only strings avoid UTC shifts", () => {
  const { format } = setup();
  assert.equal(format.formatPostDate("2026-10-07"), "7 de octubre de 2026");
  assert.equal(format.formatPostDate("2026-10-08T00:30:00.000Z"), "7 de octubre de 2026");
  for (const value of [null, "", "bad", "2026-02-30", "2026-02-29", "2026-10-07T99:99"]) assert.equal(format.formatPostDate(value), null);
  assert.equal(format.likesLabel(1), "1 like");
  assert.equal(format.likesLabel(2), "2 likes");
});

test("confirmed likes adjust counts exactly once, clamp at zero and do not mutate posts", () => {
  const { adapter, likes } = setup();
  const post = adapter.postsFromApi([fixture()])[0];
  const liked = likes.applyConfirmedLike(post, true);
  assert.equal(liked.userHasLiked, true);
  assert.equal(liked.likesCount, 6);
  assert.equal(post.likesCount, 5);
  assert.equal(likes.applyConfirmedLike(liked, true), liked);
  const unliked = likes.applyConfirmedLike(liked, false);
  assert.equal(unliked.likesCount, 5);
  assert.equal(unliked.userHasLiked, false);
  assert.equal(likes.applyConfirmedLike({ ...liked, likesCount: 0 }, false).likesCount, 0);
});

test("GET trims and encodes search, requires Bearer, and empty search uses the base route", async () => {
  const { service, calls } = setup();
  await service.getPosts(" token ", "  alimentación & hábitos  ");
  assert.equal(calls[0][0], "https://example.test/api/mobile/muro?search=" + encodeURIComponent("alimentación & hábitos"));
  assert.equal(calls[0][1].method, "GET");
  assert.equal(calls[0][1].headers.Accept, "application/json");
  assert.equal(calls[0][1].headers.Authorization, "Bearer token");
  await service.getPosts("token", " ");
  assert.equal(calls[1][0], "https://example.test/api/mobile/muro");
  await assert.rejects(service.getPosts("token", "a".repeat(101)), (error) => error.status === 400);
  assert.equal(calls.length, 2);
});

test("like POST has no body or user/patient identifiers and uses returned liked as authoritative", async () => {
  const harness = setup();
  harness.respond({ ok: true, data: { liked: false } });
  const result = await harness.service.togglePostLike("token", 3);
  assert.equal(result.liked, false);
  assert.equal(harness.calls[0][0], "https://example.test/api/mobile/muro/3/like");
  assert.equal(harness.calls[0][1].method, "POST");
  assert.equal(harness.calls[0][1].body, undefined);
  assert.equal(harness.calls[0][1].headers["Content-Type"], undefined);
  await assert.rejects(harness.service.togglePostLike("token", -1), (error) => error.status === 400);
  assert.equal(harness.calls.length, 1);
  harness.respond({ ok: true, data: { liked: "true" } });
  await assert.rejects(harness.service.togglePostLike("token", 3), /respuesta no válida/);
});

test("missing configuration and blank tokens fail before fetch", async () => {
  const harness = setup();
  await assert.rejects(harness.service.getPosts(" "), (error) => error.status === 401);
  for (const url of [undefined, "bad", "file:///private", "https://user:secret@example.test", "https://example.test/?private=1"]) {
    harness.env.EXPO_PUBLIC_API_URL = url;
    await assert.rejects(harness.service.getPosts("token"), /configuración/);
  }
  assert.equal(harness.calls.length, 0);
});

test("HTTP errors, non-JSON, ok:false, invalid data and network failures use safe messages", async () => {
  const harness = setup();
  for (const status of [400, 401, 403, 404, 500]) {
    harness.fetch(async () => ({ ok: false, status, json: async () => { throw new Error("SQL secret Bearer stack"); } }));
    await assert.rejects(harness.service.getPosts("token"), (error) => {
      assert.equal(error.status, status);
      assert.doesNotMatch(error.message, /SQL|secret|Bearer|stack|https?:/i);
      return error instanceof harness.service.MuroApiError;
    });
  }
  harness.fetch(async () => ({ ok: true, status: 200, json: async () => { throw new Error("bad JSON"); } }));
  await assert.rejects(harness.service.getPosts("token"), /respuesta no válida/);
  for (const body of [null, {}, { ok: false, message: "PostgreSQL token https://internal.test" }, { ok: true }, { ok: true, data: null }, { ok: true, data: {} }]) {
    harness.respond(body);
    await assert.rejects(harness.service.getPosts("token"), (error) => {
      assert.doesNotMatch(error.message, /PostgreSQL|token|https?:/i);
      return true;
    });
  }
  harness.fetch(async () => { throw new Error("private network error"); });
  await assert.rejects(harness.service.getPosts("token"), /No se pudo conectar con el servidor. Verifica tu conexión/);
  assert.equal(harness.timers.size, 0);
});

test("caller cancellation aborts GET and cleans up timers", async () => {
  const harness = setup();
  const controller = new AbortController();
  harness.fetch((_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener("abort", () => reject(new Error("cancelled")), { once: true });
  }));
  const pending = harness.service.getPosts("token", "", controller.signal);
  controller.abort();
  await assert.rejects(pending, /cancelled/);
  assert.equal(harness.calls[0][1].signal.aborted, true);
  assert.equal(harness.timers.size, 0);
});

test("timeout ends stalled requests or bodies without automatically retrying a toggle", async () => {
  for (const stalledBody of [false, true]) {
    const harness = setup();
    const stall = (signal) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true }));
    harness.fetch((_url, options) => stalledBody ? Promise.resolve({ ok: true, status: 200, json: () => stall(options.signal) }) : stall(options.signal));
    const pending = harness.service.togglePostLike("token", 1);
    await flush();
    for (const callback of harness.timers) callback();
    await assert.rejects(pending, /tardó demasiado/);
    assert.equal(harness.calls.length, 1);
    assert.equal(harness.timers.size, 0);
  }
});

test("external links validate schemes before opening HTTP(S) on each platform and handle failures", async () => {
  const harness = setup();
  await assert.rejects(harness.links.openExternalLink("javascript:alert(1)"), /no está disponible/);
  assert.equal(harness.opened.length, 0);
  assert.equal(harness.checked.length, 0);
  // A capability query may report false without native visibility configuration.
  harness.setCanOpen(false);
  for (const platform of ["android", "ios", "web"]) {
    harness.native.OS = platform;
    await harness.links.openExternalLink("https://example.test/" + platform);
    await harness.links.openExternalLink("http://example.test/" + platform);
  }
  assert.deepEqual(harness.opened, [
    "https://example.test/android", "http://example.test/android",
    "https://example.test/ios", "http://example.test/ios",
    "https://example.test/web", "http://example.test/web",
  ]);
  assert.equal(harness.checked.length, 0);
  harness.setOpenError(true);
  await assert.rejects(harness.links.openExternalLink("https://example.test/failure"), /No se pudo abrir/);
});

test("ViewModel blocks double taps for the same post and keeps confirmed count and heart synchronized", async () => {
  const harness = setup();
  harness.respond({ ok: true, data: [fixture()] });
  harness.focus(); await flush();
  const pending = deferred();
  harness.fetch(() => pending.promise);
  const current = harness.render();
  const first = current.toggleLike(1);
  const second = current.toggleLike(1);
  await flush();
  assert.equal(harness.calls.filter((call) => call[1].method === "POST").length, 1);
  assert.equal(harness.render().likingPostIds.has(1), true);
  assert.equal(harness.render().posts[0].likesCount, 5);
  pending.resolve(api({ liked: true }));
  await Promise.all([first, second]);
  const result = harness.render();
  assert.equal(result.likingPostIds.size, 0);
  assert.equal(result.posts[0].likesCount, 6);
  assert.equal(result.posts[0].userHasLiked, true);
  harness.blur();
});

test("ViewModel defers refresh until POSTs settle and reloads the active search without duplicating posts", async () => {
  const harness = setup();
  harness.respond({ ok: true, data: [fixture()] });
  harness.focus(); await flush();
  harness.render().updateSearchInput("  alimentación  ");
  harness.render().search(); await flush();
  const pending = deferred();
  harness.fetch((_url, options) => options.method === "POST" ? pending.promise : Promise.resolve(api([fixture(1, true, 6)])));
  const like = harness.render().toggleLike(1); await flush();
  const count = harness.calls.length;
  await harness.render().refreshPosts();
  assert.equal(harness.calls.length, count);
  pending.resolve(api({ liked: true })); await like; await flush();
  const result = harness.render();
  assert.equal(result.posts.length, 1);
  assert.equal(result.posts[0].likesCount, 6);
  assert.equal(result.posts[0].userHasLiked, true);
  assert.equal(harness.calls[harness.calls.length - 1][0], "https://example.test/api/mobile/muro?search=" + encodeURIComponent("alimentación"));
  harness.blur();
});

test("ViewModel holds the previous like on failure, releases its lock, and reconciles via GET instead of repeating POST", async () => {
  const harness = setup();
  harness.respond({ ok: true, data: [fixture()] });
  harness.focus(); await flush();
  harness.fetch((_url, options) => options.method === "POST" ? Promise.reject(new Error("lost connection")) : Promise.resolve(api([fixture()])));
  await harness.render().toggleLike(1); await flush();
  const result = harness.render();
  assert.equal(result.posts[0].userHasLiked, false);
  assert.equal(result.posts[0].likesCount, 5);
  assert.equal(result.likingPostIds.size, 0);
  assert.match(result.postErrors[1], /No se pudo conectar/);
  assert.equal(harness.calls.filter((call) => call[1].method === "POST").length, 1);
  harness.blur();
});

test("ViewModel rejects late GET results, aborts on blur and finishes loading for the newest query", async () => {
  const harness = setup();
  const old = deferred();
  harness.fetch(() => old.promise);
  harness.focus(); await flush();
  harness.fetch(() => Promise.resolve(api([fixture(2)])));
  harness.render().updateSearchInput(" nueva ");
  harness.render().search(); await flush();
  old.resolve(api([fixture(1)])); await flush();
  assert.equal(harness.calls[0][1].signal.aborted, true);
  assert.equal(harness.render().posts[0].id, 2);
  assert.equal(harness.render().loading, false);
  assert.equal(harness.render().activeSearch, "nueva");
  const next = deferred();
  harness.fetch(() => next.promise);
  const refresh = harness.render().refreshPosts(); await flush();
  harness.blur();
  next.resolve(api([fixture(3)])); await refresh;
  assert.equal(harness.calls[harness.calls.length - 1][1].signal.aborted, true);
  assert.equal(harness.render().posts[0].id, 2);
});

test("returning during a pending like waits for the toggle then reads authoritative server data", async () => {
  const harness = setup();
  harness.respond({ ok: true, data: [fixture()] });
  harness.focus(); await flush();
  const pending = deferred();
  harness.fetch((_url, options) => options.method === "POST" ? pending.promise : Promise.resolve(api([fixture(1, true, 6)])));
  const like = harness.render().toggleLike(1); await flush();
  harness.blur();
  const count = harness.calls.length;
  harness.focus(); await flush();
  assert.equal(harness.calls.length, count);
  pending.resolve(api({ liked: true })); await like; await flush();
  assert.equal(harness.render().posts[0].likesCount, 6);
  assert.equal(harness.render().posts[0].userHasLiked, true);
  assert.equal(harness.calls.filter((call) => call[1].method === "POST").length, 1);
  harness.blur();
});

test("401/403 clear the shared session and hide posts while a valid empty list stays a non-error state", async () => {
  for (const status of [401, 403]) {
    const harness = setup();
    harness.respond({ ok: false }, status);
    harness.focus(); await flush();
    const result = harness.render();
    assert.equal(result.sessionRequired, true);
    assert.equal(result.loading, false);
    assert.equal(result.refreshing, false);
    assert.equal(result.posts.length, 0);
    assert.equal(harness.cleared, 1);
    result.goToLogin();
    assert.equal(harness.routes[harness.routes.length - 1], "/login");
    harness.blur();
  }
  const empty = setup(); empty.focus(); await flush();
  assert.equal(empty.render().error, null);
  assert.equal(empty.render().posts.length, 0);
  assert.equal(empty.render().loading, false);
  empty.blur();
});

test("clearing search reloads all posts and input length is limited without requests on each keystroke", async () => {
  const harness = setup(); harness.focus(); await flush();
  const count = harness.calls.length;
  harness.render().updateSearchInput("a".repeat(110));
  assert.equal(harness.render().searchInput.length, 100);
  assert.equal(harness.calls.length, count);
  harness.render().search(); await flush();
  assert.equal(harness.render().activeSearch.length, 100);
  harness.render().clearSearch(); await flush();
  assert.equal(harness.render().activeSearch, "");
  assert.equal(harness.render().searchInput, "");
  assert.equal(harness.calls[harness.calls.length - 1][0], "https://example.test/api/mobile/muro");
  harness.blur();
});
