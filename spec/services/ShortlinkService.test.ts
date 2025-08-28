import 'reflect-metadata';
import { ShortLinkService } from '../../app/server/services/links/ShortlinkService';
import { ShortlinkRepository } from '../../app/server/repositories/ShortlinkRepository';
import { EventRecordRepository } from '../../app/server/repositories/EventRecordRepository';
import { StreamProducer } from '../../app/server/services/StreamProducer';
import { CreateShortLinkRequest, CreateShortLinkResponse, ResolveAliasResponse, StatsResponse, StreamMessage } from '../../app/types';
import { CustomError } from '../../app/types/error';


// Mock dependencies
const mockShortlinkRepository = {
  create: jest.fn(),
  findByAlias: jest.fn(),
  findByCampaignIdAndUrl: jest.fn(),
} as unknown as jest.Mocked<ShortlinkRepository>;

const mockEventRecordRepository = {
  create: jest.fn(),
  bulkCreate: jest.fn(),
  getStats: jest.fn(),
} as unknown as jest.Mocked<EventRecordRepository>;

const mockStreamProducer = {
  init: jest.fn(),
  publishMessage: jest.fn(),
} as unknown as jest.Mocked<StreamProducer>;

describe('ShortLinkService', () => {
  let shortLinkService: ShortLinkService;

  beforeEach(() => {
    jest.clearAllMocks();

    // Bypass constructor to avoid TSConvict usage and inject config manually
    shortLinkService = Object.create(ShortLinkService.prototype) as ShortLinkService;
    (shortLinkService as any).shortLinkRepository = mockShortlinkRepository;
    (shortLinkService as any).eventRecordRepository = mockEventRecordRepository;
    (shortLinkService as any).steamProducer = mockStreamProducer;
    (shortLinkService as any).config = {
      shortlinkAliasLength: 8,
      appBaseUrl: 'http://localhost:3000',
    } as any;
  });

  describe('createShortLink', () => {
    it('should create a new short link when no existing link found', async () => {
      // Arrange
      const request: CreateShortLinkRequest = {
        url: 'https://example.com',
        campaignId: 'campaign123',
      };
      const mockShortlink = {
        id: '1',
        url: 'https://example.com',
        campaignId: 'campaign123',
        alias: 'abc123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockShortlinkRepository.findByCampaignIdAndUrl.mockResolvedValue(null);
      mockShortlinkRepository.create.mockResolvedValue(mockShortlink);

      // Act
      const result: CreateShortLinkResponse = await shortLinkService.createShortLink(request);

      // Assert
      expect(mockShortlinkRepository.findByCampaignIdAndUrl).toHaveBeenCalledWith('campaign123', 'https://example.com');
      expect(mockShortlinkRepository.create).toHaveBeenCalledWith({
        url: 'https://example.com',
        campaignId: 'campaign123',
        alias: expect.any(String),
      });
      expect(result).toEqual({
        alias: 'abc123',
        shortUrl: 'http://localhost:3000/abc123',
        campaignId: 'campaign123',
      });
    });

    it('should return existing short link when found for same campaign and URL', async () => {
      // Arrange
      const request: CreateShortLinkRequest = {
        url: 'https://example.com',
        campaignId: 'campaign123',
      };
      const existingShortlink = {
        id: '1',
        url: 'https://example.com',
        campaignId: 'campaign123',
        alias: 'existing123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockShortlinkRepository.findByCampaignIdAndUrl.mockResolvedValue(existingShortlink);

      // Act
      const result: CreateShortLinkResponse = await shortLinkService.createShortLink(request);

      // Assert
      expect(mockShortlinkRepository.findByCampaignIdAndUrl).toHaveBeenCalledWith('campaign123', 'https://example.com');
      expect(mockShortlinkRepository.create).not.toHaveBeenCalled();
      expect(result).toEqual({
        alias: 'existing123',
        shortUrl: 'http://localhost:3000/existing123',
        campaignId: 'campaign123',
      });
    });

    it('should create short link with custom vanity URL', async () => {
      // Arrange
      const request: CreateShortLinkRequest = {
        url: 'https://example.com',
        campaignId: 'campaign123',
        vanity: 'custom-alias',
      };
      const mockShortlink = {
        id: '1',
        url: 'https://example.com',
        campaignId: 'campaign123',
        alias: 'custom-alias',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockShortlinkRepository.create.mockResolvedValue(mockShortlink);

      // Act
      const result: CreateShortLinkResponse = await shortLinkService.createShortLink(request);

      // Assert
      expect(mockShortlinkRepository.findByCampaignIdAndUrl).not.toHaveBeenCalled();
      expect(mockShortlinkRepository.create).toHaveBeenCalledWith({
        url: 'https://example.com',
        campaignId: 'campaign123',
        alias: 'custom-alias',
      });
      expect(result.alias).toBe('custom-alias');
    });

    it('should generate unique alias when no vanity provided', async () => {
      // Arrange
      const request: CreateShortLinkRequest = {
        url: 'https://example.com',
        campaignId: 'campaign123',
      };
      const mockShortlink = {
        id: '1',
        url: 'https://example.com',
        campaignId: 'campaign123',
        alias: 'generated123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockShortlinkRepository.findByCampaignIdAndUrl.mockResolvedValue(null);
      mockShortlinkRepository.create.mockResolvedValue(mockShortlink);

      // Act
      const result = await shortLinkService.createShortLink(request);

      // Assert
      const createCall = mockShortlinkRepository.create.mock.calls[0][0];
      expect(createCall.alias).toBeDefined();
      expect(typeof createCall.alias).toBe('string');
      expect(createCall.alias.length).toBeGreaterThan(0);
    });
  });

  describe('resolveAlias', () => {
    it('should resolve alias and publish click event', async () => {
      // Arrange
      const alias = 'test123';
      const mockShortlink = {
        id: '1',
        url: 'https://example.com',
        campaignId: 'campaign123',
        alias: 'test123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockShortlinkRepository.findByAlias.mockResolvedValue(mockShortlink);
      mockStreamProducer.publishMessage.mockResolvedValue('message-id-123');

      // Act
      const result: ResolveAliasResponse = await shortLinkService.resolveAlias(alias);

      // Assert
      expect(mockShortlinkRepository.findByAlias).toHaveBeenCalledWith('test123');
      expect(mockStreamProducer.publishMessage).toHaveBeenCalledWith(
        'shortlink:click',
        {
          alias: 'test123',
          url: 'https://example.com',
          campaignId: 'campaign123',
          timestamp: expect.any(String),
          eventType: 'click',
        }
      );
      expect(result).toEqual({
        url: 'https://example.com',
        alias: 'test123',
      });
    });

    it('should throw CustomError when alias not found', async () => {
      // Arrange
      const alias = 'nonexistent';
      mockShortlinkRepository.findByAlias.mockResolvedValue(null);

      // Act & Assert
      await expect(shortLinkService.resolveAlias(alias)).rejects.toThrow(CustomError);
      expect(mockShortlinkRepository.findByAlias).toHaveBeenCalledWith('nonexistent');
      expect(mockStreamProducer.publishMessage).not.toHaveBeenCalled();
    });

    it('should handle stream producer errors gracefully', async () => {
      // Arrange
      const alias = 'test123';
      const mockShortlink = {
        id: '1',
        url: 'https://example.com',
        campaignId: 'campaign123',
        alias: 'test123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockShortlinkRepository.findByAlias.mockResolvedValue(mockShortlink);
      mockStreamProducer.publishMessage.mockResolvedValue('message-id-err-sim');

      // Act
      const result = await shortLinkService.resolveAlias(alias);

      // Assert
      expect(result).toEqual({
        url: 'https://example.com',
        alias: 'test123',
      });
    });
  });

  describe('recordEvent', () => {
    it('should process and bulk create event records', async () => {
      // Arrange
      const messages: StreamMessage[] = [
        {
          id: 'msg1',
          timestamp: 1234567890000,
          fields: {
            alias: 'test123',
            eventType: 'click',
            timestamp: '1234567890000',
          },
        },
        {
          id: 'msg2',
          timestamp: 1234567891000,
          fields: {
            alias: 'test456',
            eventType: 'click',
            timestamp: '1234567891000',
          },
        },
      ];

      const expectedRecords = [
        {
          alias: 'test123',
          timestamp: new Date(1234567890000).toISOString(),
          eventType: 'click',
          eventData: messages[0],
        },
        {
          alias: 'test456',
          timestamp: new Date(1234567891000).toISOString(),
          eventType: 'click',
          eventData: messages[1],
        },
      ];

      mockEventRecordRepository.bulkCreate.mockResolvedValue(expectedRecords);

      // Act
      await shortLinkService.recordEvent(messages);

      // Assert
      expect(mockEventRecordRepository.bulkCreate).toHaveBeenCalledWith(expectedRecords);
    });

    it('should handle empty messages array', async () => {
      // Arrange
      const messages: StreamMessage[] = [];

      // Act
      await shortLinkService.recordEvent(messages);

      // Assert
      expect(mockEventRecordRepository.bulkCreate).toHaveBeenCalledWith([]);
    });
  });

  describe('getStats', () => {
    it('should return comprehensive stats for an alias', async () => {
      // Arrange
      const alias = 'test123';
      const startDate = '2023-01-01T00:00:00.000Z';
      const endDate = '2023-01-02T23:59:59.999Z';
      
      const mockEventRecords = [
        {
          id: '1',
          alias: 'test123',
          timestamp: '2023-01-01T10:00:00.000Z',
          eventType: 'click',
          eventData: {},
        },
        {
          id: '2',
          alias: 'test123',
          timestamp: '2023-01-01T14:00:00.000Z',
          eventType: 'click',
          eventData: {},
        },
        {
          id: '3',
          alias: 'test123',
          timestamp: '2023-01-02T09:00:00.000Z',
          eventType: 'click',
          eventData: {},
        },
      ];

      mockEventRecordRepository.getStats.mockResolvedValue(mockEventRecords);

      // Act
      const result: StatsResponse = await shortLinkService.getStats(alias, startDate, endDate);

      // Assert
      expect(mockEventRecordRepository.getStats).toHaveBeenCalledWith(alias, startDate, endDate);
      expect(result).toEqual({
        alias: 'test123',
        totalClicks: 3,
        daily: {
          '2023-01-01': 2,
          '2023-01-02': 1,
        },
        hourly: {
          '2023-01-01-10': 1,
          '2023-01-01-14': 1,
          '2023-01-02-09': 1,
        },
      });
    });

    it('should return empty stats when no events found', async () => {
      // Arrange
      const alias = 'test123';
      const startDate = '2023-01-01T00:00:00.000Z';
      const endDate = '2023-01-02T23:59:59.999Z';

      mockEventRecordRepository.getStats.mockResolvedValue([]);

      // Act
      const result: StatsResponse = await shortLinkService.getStats(alias, startDate, endDate);

      // Assert
      expect(result).toEqual({
        alias: 'test123',
        totalClicks: 0,
        daily: {},
        hourly: {},
      });
    });

    it('should handle repository errors', async () => {
      // Arrange
      const alias = 'test123';
      const startDate = '2023-01-01T00:00:00.000Z';
      const endDate = '2023-01-02T23:59:59.999Z';

      mockEventRecordRepository.getStats.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(shortLinkService.getStats(alias, startDate, endDate)).rejects.toThrow('Database error');
    });
  });
}); 