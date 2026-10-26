module.exports = {
  ...require("./jest.config.cjs"),
  testMatch: ["<rootDir>/tests/integration/mock/**/*.test.ts"],
  collectCoverageFrom: ["src/modules/**/services/*.ts"],
  coverageDirectory: "coverage/integration-mock",
  testTimeout: 10000,
};
