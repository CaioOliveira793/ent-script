/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

module.exports = {
	globals: {
		'ts-jest': {
			tsconfig: {
				strict: true,
				strictFunctionTypes: false,
				noImplicitReturns: false,
				noImplicitThis: true,
				noImplicitAny: true,
				strictNullChecks: true,
				alwaysStrict: false,
				noUnusedLocals: true,
				noUnusedParameters: true,
			}
		}
	},
	collectCoverage: false,
	collectCoverageFrom: [
		'./src/**/*.{js,ts}',
		'!./src/index.{js,ts}',
		'!**/node_modules/**',
		'!**/dist/**',
	],
	coverageDirectory: "test/coverage",
	coverageProvider: "v8",
	coverageReporters: [
		"json",
		"text",
		"lcov",
	],
	coverageThreshold: {
		global: {
			branches: 50,
			functions: 50,
			lines: 50,
			statement: 50
		}
	},
	preset: "ts-jest",
	testEnvironment: "node",
	testMatch: [
		"**/tests/**/*.[jt]s?(x)",
		"**/?(*.)+(spec|test).[tj]s?(x)"
	],
};
