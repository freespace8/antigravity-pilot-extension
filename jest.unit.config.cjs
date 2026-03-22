module.exports = {
  displayName: 'unit',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['<rootDir>/tests/integration/'],
  moduleNameMapper: {
    '^vscode$': '<rootDir>/src/test-support/vscodeMock.ts'
  },
  clearMocks: true
};
