const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

// Contract fixtures are isolated here; the application always calls the real API.
const NOW = Date.parse("2026-10-07T18:00:00Z");
class FixedDate extends Date {
  constructor(...args) {
    super(...(args.length ? args : [NOW]));
  }
  static now() {
    return NOW;
  }
}
class CapturingFormData {
  constructor() {
    this.fields = [];
  }
  append(...field) {
    this.fields.push(field);
  }
}

function setup(platform = "android") {
  const calls = [];
  const native = { OS: platform };
  let response = {
    ok: true,
    status: 200,
    json: async () => ({ ok: true, data: [] }),
  };
  let picked = { canceled: true };
  let nativeSize = 1024;
  const context = vm.createContext({
    Date: FixedDate,
    Intl,
    Blob,
    FormData: CapturingFormData,
    process: { env: { EXPO_PUBLIC_API_URL: "https://example.test/" } },
    fetch: async (...args) => {
      calls.push(args);
      if (response instanceof Error) throw response;
      return response;
    },
  });
  const cache = new Map();
  function load(relativePath) {
    const filename = path.resolve(relativePath);
    if (cache.has(filename)) return cache.get(filename);
    const module = { exports: {} };
    const requireModule = (id) => {
      if (id === "react-native") return { Platform: native };
      if (id === "expo-image-picker")
        return {
          launchImageLibraryAsync: async () => picked,
          UIImagePickerPreferredAssetRepresentationMode: {
            Compatible: "compatible",
          },
        };
      if (id === "expo-file-system")
        return {
          File: class {
            get size() {
              return nativeSize;
            }
          },
        };
      if (id.startsWith("."))
        return load(path.join(path.dirname(filename), `${id}.ts`));
      throw new Error(`Unexpected test import: ${id}`);
    };
    const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
      },
    }).outputText;
    vm.runInContext(
      `(function(require,module,exports){${compiled}\n})`,
      context,
      { filename },
    )(requireModule, module, module.exports);
    cache.set(filename, module.exports);
    return module.exports;
  }
  return {
    calls,
    adapter: load("src/modules/citas/adapters/citas-adapter.ts"),
    receiptAdapter: load("src/modules/citas/adapters/receipt-adapter.ts"),
    service: load("src/modules/citas/services/citas-service.ts"),
    picker: load("src/modules/citas/services/receipt-service.ts"),
    dates: load("src/modules/citas/utils/citas-date.ts"),
    respond: (data, status = 200) => {
      response = {
        ok: status < 400,
        status,
        json: async () => ({
          ok: status < 400,
          ...(status < 400 ? { data } : { message: data }),
        }),
      };
    },
    nonJson: () => {
      response = {
        ok: true,
        status: 200,
        json: async () => {
          throw new Error("not JSON");
        },
      };
    },
    networkError: () => {
      response = new Error("network failed");
    },
    chooseImage: (result, size = 1024) => {
      picked = result;
      nativeSize = size;
    },
  };
}
const plain = (value) => JSON.parse(JSON.stringify(value));
const receipt = {
  uri: "file:///fixture/receipt.jpg",
  name: "comprobante.jpg",
  type: "image/jpeg",
  size: 1024,
};
const input = {
  appointmentDate: "2026-10-08",
  startTime: "13:30:00",
  notes: " Seguimiento ",
  receipt,
};

test("adapts nullable fields, numeric amounts, translated states and chronological order", () => {
  const { adapter } = setup();
  const appointments = adapter.appointmentsFromApi([
    {
      id: "2",
      appointment_date: "2026-10-10T00:00:00.000Z",
      start_time: "09:00",
      status: "pending_payment",
      payment_status: "pending_review",
      deposit_paid: false,
      deposit_amount: "100.50",
      notes: " Nota ",
    },
    {
      id: 1,
      appointment_date: "2026-10-08",
      start_time: "10:00:00",
      status: "scheduled",
      payment_status: null,
      deposit_amount: null,
    },
  ]);
  assert.equal(appointments[0].id, 1);
  assert.equal(appointments[0].paymentLabel, null);
  assert.equal(appointments[1].date, "2026-10-10");
  assert.equal(appointments[1].statusLabel, "Pendiente de anticipo");
  assert.equal(appointments[1].paymentLabel, "En revisión");
  assert.equal(appointments[1].depositAmount, 100.5);
  assert.equal(appointments[1].notes, "Nota");
  const minimal = adapter.appointmentsFromApi([
    { id: 3, deposit_amount: " " },
  ])[0];
  assert.equal(minimal.date, null);
  assert.equal(minimal.depositAmount, null);
  assert.equal(minimal.status, "unknown");
  assert.throws(() => adapter.appointmentsFromApi({}));
  assert.throws(() => adapter.appointmentsFromApi([{ id: 0 }]));
});

test("preserves clinic calendar dates, rejects impossible or past dates and elapsed slots", () => {
  const { dates, adapter } = setup();
  assert.equal(dates.calendarDate("2026-10-08T00:00:00.000Z"), "2026-10-08");
  assert.equal(dates.calendarDate("2026-02-30"), null);
  assert.equal(dates.isBookableDate("2026-10-06"), false);
  assert.equal(dates.isBookableDate("2026-10-07"), true);
  assert.equal(dates.isBookableDate("2026-10-07T00:00:00Z"), false);
  assert.equal(dates.normalizeTime("25:00:00"), null);
  assert.equal(dates.normalizeTime("12:30:99"), null);
  assert.deepEqual(
    plain(
      adapter.availabilityFromApi(
        ["11:00:00", "13:00", "13:00:00", "14:30:00"],
        "2026-10-07",
      ),
    ),
    ["13:00:00", "14:30:00"],
  );
  assert.throws(() => adapter.availabilityFromApi(["bad"], "2026-10-08"));
});

test("only permits modifications for supported future appointment states", () => {
  const { dates } = setup();
  const appointment = {
    date: "2026-10-08",
    startTime: "09:00:00",
    status: "scheduled",
  };
  assert.equal(dates.canModifyAppointment(appointment), true);
  for (const status of ["cancelled", "completed", "no_show", "unknown"])
    assert.equal(dates.canModifyAppointment({ ...appointment, status }), false);
  assert.equal(
    dates.canModifyAppointment({ ...appointment, date: "2026-10-06" }),
    false,
  );
  assert.equal(
    dates.canModifyAppointment({ ...appointment, startTime: null }),
    false,
  );
});

test("receipt types, size boundaries and safe filename are enforced", () => {
  const { receiptAdapter } = setup();
  const selected = receiptAdapter.receiptFromAsset({
    uri: "file:///private/random.png",
    mimeType: "image/png",
    fileSize: 5 * 1024 * 1024,
  });
  assert.equal(selected.name, "comprobante.png");
  assert.equal(selected.type, "image/png");
  assert.throws(
    () =>
      receiptAdapter.validateReceipt({ ...receipt, size: 5 * 1024 * 1024 + 1 }),
    /5 MB/,
  );
  assert.throws(() => receiptAdapter.validateReceipt({ ...receipt, size: 0 }));
  assert.throws(
    () =>
      receiptAdapter.receiptFromAsset({
        uri: "file:///photo.heic",
        mimeType: "image/heic",
        fileSize: 1024,
      }),
    /JPG/,
  );
  assert.equal(
    receiptAdapter.receiptFromAsset({
      uri: "file:///photo.webp",
      fileSize: 1024,
    }).type,
    "image/webp",
  );
});

test("picker cancellation preserves the form and native file size is checked", async () => {
  const env = setup();
  assert.equal(await env.picker.selectReceipt(), null);
  env.chooseImage(
    {
      canceled: false,
      assets: [
        { uri: "file:///receipt.jpg", mimeType: "image/jpeg", fileSize: 1024 },
      ],
    },
    6 * 1024 * 1024,
  );
  await assert.rejects(env.picker.selectReceipt(), /5 MB/);
  env.chooseImage(
    {
      canceled: false,
      assets: [{ uri: "file:///receipt.jpg", mimeType: "image/jpeg" }],
    },
    2048,
  );
  assert.equal((await env.picker.selectReceipt()).size, 2048);
});

test("reads real paths with Bearer authentication, availability date and cancellation signal", async () => {
  const env = setup();
  env.respond([]);
  const controller = new AbortController();
  await env.service.getAppointments("token-fixture", controller.signal);
  await env.service.getAvailability(
    "token-fixture",
    "2026-10-08",
    controller.signal,
  );
  assert.equal(env.calls[0][0], "https://example.test/api/mobile/citas");
  assert.equal(
    env.calls[1][0],
    "https://example.test/api/mobile/citas/disponibilidad?date=2026-10-08",
  );
  assert.equal(env.calls[0][1].headers.Authorization, "Bearer token-fixture");
  assert.equal(env.calls[0][1].signal, controller.signal);
  await assert.rejects(
    env.service.getAvailability("token-fixture", "2026-10-06"),
    /pasado/,
  );
  assert.equal(env.calls.length, 2);
});

test("creation uses multipart with native descriptor, without patientId or manual Content-Type", async () => {
  const env = setup();
  env.respond({
    appointmentId: 9,
    paymentReference: "reference-fixture",
    depositAmount: 100,
    message: "Solicitud recibida",
  });
  const created = await env.service.createAppointment("token-fixture", input);
  assert.equal(created.message, "Solicitud recibida");
  const [url, options] = env.calls[0];
  assert.equal(url, "https://example.test/api/mobile/citas");
  assert.equal(options.method, "POST");
  assert.equal(options.headers["Content-Type"], undefined);
  assert.deepEqual(
    options.body.fields.map(([key]) => key),
    ["appointmentDate", "startTime", "notes", "receipt"],
  );
  assert.equal(options.body.fields[2][1], "Seguimiento");
  assert.deepEqual(plain(options.body.fields[3][1]), {
    uri: receipt.uri,
    name: receipt.name,
    type: receipt.type,
  });
  await assert.rejects(
    env.service.createAppointment("token-fixture", {
      ...input,
      notes: "a".repeat(501),
    }),
    /500/,
  );
  await assert.rejects(
    env.service.createAppointment("token-fixture", {
      ...input,
      receipt: { ...receipt, size: 6 * 1024 * 1024 },
    }),
    /5 MB/,
  );
  assert.equal(env.calls.length, 1);
});

test("web receipt uses the selected Blob and safe filename", () => {
  const env = setup("web");
  const webFile = new Blob(["fixture"], { type: "image/jpeg" });
  const form = env.service.createAppointmentFormData({
    ...input,
    receipt: { ...receipt, webFile },
  });
  assert.equal(form.fields[3][1], webFile);
  assert.equal(form.fields[3][2], "comprobante.jpg");
  assert.throws(
    () => env.service.createAppointmentFormData(input),
    /nuevamente/,
  );
});

test("cancellation has no body and rescheduling sends only the requested JSON fields", async () => {
  const env = setup();
  env.respond({ cancelled: true });
  await env.service.cancelAppointment("token-fixture", 7);
  assert.equal(
    env.calls[0][0],
    "https://example.test/api/mobile/citas/7/cancelar",
  );
  assert.equal(env.calls[0][1].method, "PATCH");
  assert.equal(env.calls[0][1].body, undefined);
  env.respond({ rescheduled: true, date: "2026-10-08", startTime: "14:00:00" });
  await env.service.rescheduleAppointment("token-fixture", 7, {
    date: "2026-10-08",
    startTime: "14:00:00",
  });
  assert.equal(
    env.calls[1][0],
    "https://example.test/api/mobile/citas/7/reprogramar",
  );
  assert.equal(env.calls[1][1].headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(env.calls[1][1].body), {
    date: "2026-10-08",
    startTime: "14:00:00",
  });
  await assert.rejects(env.service.cancelAppointment("token-fixture", -1));
  assert.equal(env.calls.length, 2);
});

test("handles missing token, authorization, not found, slot conflicts, server errors and invalid responses", async () => {
  const env = setup();
  await assert.rejects(
    env.service.getAppointments(""),
    (error) => error.status === 401,
  );
  assert.equal(env.calls.length, 0);
  for (const status of [401, 403]) {
    env.respond("Private error", status);
    await assert.rejects(
      env.service.getAppointments("token-fixture"),
      (error) => error.status === status && /sesión/.test(error.message),
    );
  }
  env.respond("Paciente no encontrado.", 404);
  await assert.rejects(
    env.service.getAppointments("token-fixture"),
    /Paciente no encontrado/,
  );
  env.respond("El horario no está disponible.", 400);
  await assert.rejects(
    env.service.createAppointment("token-fixture", input),
    /horario no está disponible/,
  );
  env.respond("postgres SQLSTATE private details", 500);
  await assert.rejects(
    env.service.getAppointments("token-fixture"),
    (error) => !error.message.includes("SQLSTATE"),
  );
  env.nonJson();
  await assert.rejects(
    env.service.getAppointments("token-fixture"),
    /respuesta no válida/,
  );
  env.networkError();
  await assert.rejects(
    env.service.getAppointments("token-fixture"),
    /conexión/,
  );
  assert.throws(() =>
    env.adapter.cancelledAppointmentFromApi({ cancelled: false }),
  );
  assert.throws(() =>
    env.adapter.rescheduledAppointmentFromApi({
      rescheduled: true,
      date: "invalid",
    }),
  );
});
