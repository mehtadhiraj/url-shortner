module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/spec'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'app/**/*.ts',
    '!app/**/*.d.ts',
    '!app/data/**',
    '!app/app.ts',
    '!app/server/Server.ts',
    '!app/server/controllers/**',
    '!app/server/middlewares/**',
    '!app/server/interceptors/**',
    '!app/server/repositories/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/spec/setup.ts'],
  moduleNameMapping: {
    '^app/(.*)$': '<rootDir>/app/$1',
  },
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
}; 