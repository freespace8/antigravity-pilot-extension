module.exports = {
  displayName: 'integration',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/integration/**/*.test.ts'],
  moduleNameMapper: {
    '^vscode$': '<rootDir>/src/test-support/vscodeMock.ts'
  },
  clearMocks: true
};
