const { assertReleaseContext, validateConfig, validateBuild } = require("../../scripts/android-release.cjs");

const config = { version: "1.0.0", owner: "fixture-owner", android: { package: "org.fixture.nutrition" }, extra: { eas: { projectId: "00000000-0000-0000-0000-000000000001" } } };
const expected = { version: "1.0.0", sourceSha: "a".repeat(40), projectId: config.extra.eas.projectId, packageName: config.android.package, owner: config.owner };
const build = { id: "00000000-0000-0000-0000-000000000002", status: "FINISHED", platform: "ANDROID", gitCommitHash: expected.sourceSha, appVersion: "1.0.0", appBuildVersion: "2", app: { id: expected.projectId, ownerAccount: { name: expected.owner } }, appIdentifier: expected.packageName, buildProfile: "production", distribution: "STORE", artifacts: { applicationArchiveUrl: "https://expo.dev/artifacts/eas/fixture.aab" } };

describe("Controles de liberación sin operaciones remotas", () => {
  test("rechaza ejecución local o sin autorización", () => {
    expect(() => assertReleaseContext("ENVIAR_A_PRUEBAS_INTERNAS")).toThrow(/autorización/);
  });
  test("identidad y versión deben ser reales y consistentes", () => {
    expect(validateConfig(config, "1.0.0")).toBe(config);
    expect(() => validateConfig(config, "2.0.0")).toThrow();
    expect(() => validateConfig({ ...config, android: {} }, "1.0.0")).toThrow();
  });
  test("rechaza build de otro commit, versión, proyecto o tipo de artefacto", () => {
    expect(validateBuild(build, expected).versionCode).toBe("2");
    for (const patch of [{ status: "ERRORED" }, { platform: "IOS" }, { gitCommitHash: "b".repeat(40) }, { appVersion: "2.0.0" }, { app: { id: "otro" } }, { appIdentifier: "otro.paquete" }, { buildProfile: "preview" }, { distribution: "INTERNAL" }, { appBuildVersion: "0" }, { artifacts: { buildUrl: "https://expo.dev/fixture.apk" } }]) {
      expect(() => validateBuild({ ...build, ...patch }, expected)).toThrow();
    }
    expect(() => validateBuild(build, { ...expected, versionCode: "3" })).toThrow();
  });
});
