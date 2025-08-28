import { CreateShortLinkRequest, CreateShortLinkResponse, ResolveAliasResponse, StatsResponse, StreamMessage, ShortlinkObject, EventRecordObject } from '../../app/types';

export class TestDataFactory {
  static createShortLinkRequest(overrides: Partial<CreateShortLinkRequest> = {}): CreateShortLinkRequest {
    return {
      url: 'https://example.com',
      campaignId: 'test-campaign',
      vanity: undefined,
      ...overrides,
    };
  }

  static createShortLinkResponse(overrides: Partial<CreateShortLinkResponse> = {}): CreateShortLinkResponse {
    return {
      alias: 'test123',
      shortUrl: 'http://localhost:3000/test123',
      campaignId: 'test-campaign',
      ...overrides,
    };
  }

  static createResolveAliasResponse(overrides: Partial<ResolveAliasResponse> = {}): ResolveAliasResponse {
    return {
      url: 'https://example.com',
      alias: 'test123',
      ...overrides,
    };
  }

  static createStatsResponse(overrides: Partial<StatsResponse> = {}): StatsResponse {
    return {
      alias: 'test123',
      totalClicks: 100,
      daily: {
        '2023-01-01': 50,
        '2023-01-02': 50,
      },
      hourly: {
        '2023-01-01-10': 25,
        '2023-01-01-14': 25,
        '2023-01-02-09': 25,
        '2023-01-02-15': 25,
      },
      ...overrides,
    };
  }

  static createStreamMessage(overrides: Partial<StreamMessage> = {}): StreamMessage {
    return {
      id: '1234567890-0',
      timestamp: 1234567890000,
      fields: {
        alias: 'test123',
        url: 'https://example.com',
        campaignId: 'test-campaign',
        eventType: 'click',
        timestamp: '1234567890000',
      },
      ...overrides,
    };
  }

  static createShortlinkObject(overrides: Partial<ShortlinkObject> = {}): ShortlinkObject {
    return {
      id: '1',
      url: 'https://example.com',
      campaignId: 'test-campaign',
      alias: 'test123',
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
      updatedAt: new Date('2023-01-01T00:00:00.000Z'),
      ...overrides,
    };
  }

  static createEventRecordObject(overrides: Partial<EventRecordObject> = {}): EventRecordObject {
    return {
      id: '1',
      alias: 'test123',
      timestamp: '2023-01-01T10:00:00.000Z',
      eventType: 'click',
      eventData: {
        alias: 'test123',
        url: 'https://example.com',
        campaignId: 'test-campaign',
      },
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
      updatedAt: new Date('2023-01-01T00:00:00.000Z'),
      ...overrides,
    };
  }

  static createMultipleStreamMessages(count: number): StreamMessage[] {
    return Array.from({ length: count }, (_, index) =>
      this.createStreamMessage({
        id: `${1234567890 + index}-0`,
        timestamp: 1234567890000 + index * 1000,
        fields: {
          alias: `test${index + 1}`,
          url: `https://example${index + 1}.com`,
          campaignId: `campaign${index + 1}`,
          eventType: 'click',
          timestamp: String(1234567890000 + index * 1000),
        },
      })
    );
  }

  static createMultipleEventRecords(count: number): EventRecordObject[] {
    return Array.from({ length: count }, (_, index) =>
      this.createEventRecordObject({
        id: String(index + 1),
        alias: `test${index + 1}`,
        timestamp: new Date(2023, 0, 1, 10 + index, 0, 0).toISOString(),
        eventData: {
          alias: `test${index + 1}`,
          url: `https://example${index + 1}.com`,
          campaignId: `campaign${index + 1}`,
        },
      })
    );
  }
}

export class MockHelpers {
  static createMockRedisInstance() {
    return {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
    };
  }

  static createMockRedisStreamsProvider() {
    return {
      addToStream: jest.fn(),
      readFromStream: jest.fn(),
      createConsumerGroup: jest.fn(),
      acknowledgeMessage: jest.fn(),
    };
  }

  static createMockLogger() {
    return {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };
  }

  static resetAllMocks(...mocks: any[]) {
    mocks.forEach(mock => {
      if (mock && typeof mock.mockReset === 'function') {
        mock.mockReset();
      }
    });
    jest.clearAllMocks();
  }
}

export const TEST_CONFIG = {
  shortlinkAliasLength: 8,
  appBaseUrl: 'http://localhost:3000',
  redis: {
    streams: {
      maxRetries: 3,
      readCount: 10,
    },
  },
  consumerName: 'ClickConsumer',
};

export const STREAM_KEYS = {
  SHORTLINK_CLICK: 'shortlink:click',
  SHORTLINK_CLICK_GROUP: 'shortlink:click:group',
};

export const ERROR_MESSAGES = {
  NOT_FOUND: 'Link not found',
  VALIDATION_ERROR: 'Validation failed',
  DATABASE_ERROR: 'Database connection failed',
  REDIS_ERROR: 'Redis connection failed',
}; 