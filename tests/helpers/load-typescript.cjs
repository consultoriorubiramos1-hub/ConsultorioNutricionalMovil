const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

// Solo sustituye Platform (web) para que Node envíe Blob/FormData estándar.
// Los servicios y adapters se cargan desde src; el transporte es fetch real.
function createAppLoader(apiUrl) {
  const root = path.resolve(__dirname, "../..");
  const cache = new Map();
  const context = vm.createContext({
    Date, Intl, URL, Blob, FormData, AbortController, setTimeout, clearTimeout,
    process: { env: { EXPO_PUBLIC_API_URL: apiUrl } },
    fetch: (url, options = {}) => {
      if (new URL(url).origin !== new URL(apiUrl).origin) throw new Error("Host fuera del entorno de prueba.");
      return fetch(url, { ...options, redirect: "error", signal: options.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)])
        : AbortSignal.timeout(15000) });
    },
  });
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (!filename.startsWith(root + path.sep)) throw new Error("Import fuera del proyecto.");
    if (cache.has(filename)) return cache.get(filename);
    const module = { exports: {} };
    cache.set(filename, module.exports);
    const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    }).outputText;
    vm.runInContext("(function(require,module,exports){" + compiled + "\n})", context, { filename })(
      (id) => {
        if (id === "react-native") return { Platform: { OS: "web" } };
        if (id.startsWith(".")) return load(path.relative(root, path.resolve(path.dirname(filename), id + ".ts")));
        throw new Error("Import no soportado por la prueba HTTP: " + id);
      }, module, module.exports,
    );
    return module.exports;
  }
  return load;
}
module.exports = { createAppLoader };
