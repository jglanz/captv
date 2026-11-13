/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },
  // swc transpiles only; `pnpm typecheck` type checks the tests through
  // tsconfig.test.json. @swc/jest hoists `jest.mock` calls above the imports.
  transform: {
    '^.+\\.ts$': [
      '@swc/jest',
      {
        swcrc: false,
        jsc: { target: 'esnext', parser: { syntax: 'typescript' } },
        module: { type: 'commonjs' },
      },
    ],
  },
}
