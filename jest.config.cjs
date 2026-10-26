module.exports = {
  preset: "jest-expo",
  cacheDirectory: "<rootDir>/.expo/jest-cache",
  testMatch: ["<rootDir>/tests/unit/**/*.test.ts"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"],
  clearMocks: true,
  restoreMocks: true,
  collectCoverageFrom: [
    "src/modules/**/adapters/*.ts",
    "src/modules/**/utils/*.ts",
  ],
  coverageDirectory: "coverage/unit",
  coverageReporters: ["text", "lcov", "json-summary"],
};
