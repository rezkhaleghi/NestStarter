module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",

  roots: ["<rootDir>/src"],

  moduleNameMapper: {
    "^@domain/(.*)$": "<rootDir>/src/domain/$1",
    "^@application/(.*)$": "<rootDir>/src/application/$1",
    "^@infrastructure/(.*)$": "<rootDir>/src/infrastructure/$1",
    "^@api/(.*)$": "<rootDir>/src/api/$1",
    "^@shared/(.*)$": "<rootDir>/src/shared/$1",
  },

  collectCoverageFrom: ["src/**/*.ts"],
};
