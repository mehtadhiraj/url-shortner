import 'reflect-metadata';

// Mock the logger to prevent console output during tests
jest.mock('../libs/logs/logger', () => ({
  Logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock Redis provider
jest.mock('../app/data/RedisProvider', () => {
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
  };

  const getRedisInstance = jest.fn(async () => mockRedis);
  const connect = jest.fn(async () => mockRedis);
  const acquireLock = jest.fn(async () => true);
  const releaseLock = jest.fn(async () => true);

  return {
    getRedisInstance,
    connect,
    acquireLock,
    releaseLock,
    default: { getRedisInstance, connect, acquireLock, releaseLock },
  };
});

// Mock the config loader and decorators
jest.mock('ts-convict', () => {
  const mockConfig = {
    db: {
      host: 'localhost',
      port: 5432,
      database: 'test',
      user: 'test',
      password: 'test',
      url: 'postgresql://test:test@localhost:5432/test',
      poolMin: 2,
      poolMax: 10,
      poolIdle: 10000,
    },
    redis: {
      url: 'redis://localhost:6379',
      streams: {
        consumerGroup: 'test-group',
        consumerName: 'test-consumer',
        blockTime: 5000,
        maxRetries: 3,
        readCount: 10,
      },
    },
    mode: 'CONSUMER',
    port: 3000,
    hostname: 'localhost',
    apiRoot: '/api',
    printStackTrace: true,
    nodeEnv: 'test',
    shortlinkAliasLength: 8,
    appBaseUrl: 'http://localhost:3000',
    consumerName: 'ClickConsumer',
  };

  return {
    TSConvict: jest.fn().mockImplementation(() => ({
      load: jest.fn().mockReturnValue(mockConfig),
    })),
    Property: jest.fn(() => jest.fn()),
    Config: jest.fn(() => jest.fn()),
  };
});

// Set up global test timeout
jest.setTimeout(30000);