import 'reflect-metadata';
import { LinksController } from '../../app/server/controllers/links/LinksController';
import { ShortLinkService } from '../../app/server/services/links/ShortlinkService';
import { CreateShortLinkRequest, CreateShortLinkResponse, ResolveAliasResponse, StatsResponse, CustomError } from '../../app/types';
import { Logger } from '../../libs/logs/logger';
import { Response } from 'express';
import { BAD_REQUEST_ERROR, NOT_FOUND_ERROR } from '../../app/server/constants/ErrorCode';
import { BadRequestError, NotFoundError } from 'routing-controllers';

// Mock dependencies
jest.mock('../../libs/logs/logger');

const mockShortLinkService = {
  createShortLink: jest.fn(),
  resolveAlias: jest.fn(),
  getStats: jest.fn(),
} as unknown as jest.Mocked<ShortLinkService>;

const mockResponse = {
  status: jest.fn().mockReturnThis(),
  redirect: jest.fn(),
  json: jest.fn(),
} as unknown as jest.Mocked<Response>;

describe('LinksController', () => {
  let linksController: LinksController;

  beforeEach(() => {
    jest.clearAllMocks();
    linksController = new LinksController(mockShortLinkService);
  });

  describe('createLink', () => {
    it('should create a short link successfully', async () => {
      // Arrange
      const request: CreateShortLinkRequest = {
        url: 'https://example.com',
        campaignId: 'campaign123',
      };
      const expectedResponse: CreateShortLinkResponse = {
        alias: 'abc123',
        shortUrl: 'http://localhost:3000/abc123',
        campaignId: 'campaign123',
      };

      mockShortLinkService.createShortLink.mockResolvedValue(expectedResponse);

      // Act
      const result = await linksController.createLink(request);

      // Assert
      expect(mockShortLinkService.createShortLink).toHaveBeenCalledWith(request);
      expect(result).toEqual(expectedResponse);
    });

    it('should create a short link with vanity URL', async () => {
      // Arrange
      const request: CreateShortLinkRequest = {
        url: 'https://example.com',
        campaignId: 'campaign123',
        vanity: 'custom-alias',
      };
      const expectedResponse: CreateShortLinkResponse = {
        alias: 'custom-alias',
        shortUrl: 'http://localhost:3000/custom-alias',
        campaignId: 'campaign123',
      };

      mockShortLinkService.createShortLink.mockResolvedValue(expectedResponse);

      // Act
      const result = await linksController.createLink(request);

      // Assert
      expect(mockShortLinkService.createShortLink).toHaveBeenCalledWith(request);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const invalidRequest = {
        url: 'not-a-valid-url',
        campaignId: '',
      } as CreateShortLinkRequest;

      const validationError = new BadRequestError('Invalid URL');
      mockShortLinkService.createShortLink.mockRejectedValue(validationError);

      // Act & Assert
      await expect(linksController.createLink(invalidRequest)).rejects.toThrow('Invalid URL');
    });
  });

  describe('getLink', () => {
    it('should resolve alias and return link details', async () => {
      // Arrange
      const alias = 'test123';
      const expectedResponse: ResolveAliasResponse = {
        url: 'https://example.com',
        alias: 'test123',
      };

      mockShortLinkService.resolveAlias.mockResolvedValue(expectedResponse);

      // Act
      const result = await linksController.getLink(alias, mockResponse);

      // Assert
      expect(mockShortLinkService.resolveAlias).toHaveBeenCalledWith(alias);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle alias not found error', async () => {
      // Arrange
      const alias = 'nonexistent';
      const notFoundError = new CustomError(
        new NotFoundError('Link not found'),
        NOT_FOUND_ERROR,
        'Link not found'
      );

      mockShortLinkService.resolveAlias.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(linksController.getLink(alias, mockResponse)).rejects.toThrow(notFoundError);
      expect(Logger.error).toHaveBeenCalledWith('Error while resolving alias: ' + notFoundError.toString());
    });

    it('should handle service errors during alias resolution', async () => {
      // Arrange
      const alias = 'test123';
      const serviceError = new Error('Database connection failed');

      mockShortLinkService.resolveAlias.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(linksController.getLink(alias, mockResponse)).rejects.toThrow('Database connection failed');
      expect(Logger.error).toHaveBeenCalledWith('Error while resolving alias: Error: Database connection failed');
    });

    it('should handle empty alias', async () => {
      // Arrange
      const alias = '';
      const validationError = new Error('Alias cannot be empty');

      mockShortLinkService.resolveAlias.mockRejectedValue(validationError);

      // Act & Assert
      await expect(linksController.getLink(alias, mockResponse)).rejects.toThrow('Alias cannot be empty');
    });

    it('should handle special characters in alias', async () => {
      // Arrange
      const alias = 'test-123_special.chars';
      const expectedResponse: ResolveAliasResponse = {
        url: 'https://example.com',
        alias: alias,
      };

      mockShortLinkService.resolveAlias.mockResolvedValue(expectedResponse);

      // Act
      const result = await linksController.getLink(alias, mockResponse);

      // Assert
      expect(mockShortLinkService.resolveAlias).toHaveBeenCalledWith(alias);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getStats', () => {
    it('should return stats with provided date range', async () => {
      // Arrange
      const alias = 'test123';
      const startDate = '2023-01-01T00:00:00.000Z';
      const endDate = '2023-01-31T23:59:59.999Z';
      const expectedStats: StatsResponse = {
        alias: 'test123',
        totalClicks: 100,
        daily: {
          '2023-01-01': 10,
          '2023-01-02': 15,
        },
        hourly: {
          '2023-01-01-10': 5,
          '2023-01-01-14': 5,
        },
      };

      mockShortLinkService.getStats.mockResolvedValue(expectedStats);

      // Act
      const result = await linksController.getStats(alias, startDate, endDate);

      // Assert
      expect(mockShortLinkService.getStats).toHaveBeenCalledWith(alias, startDate, endDate);
      expect(result).toEqual(expectedStats);
    });

    it('should use default dates when not provided', async () => {
      // Arrange
      const alias = 'test123';
      const expectedStats: StatsResponse = {
        alias: 'test123',
        totalClicks: 50,
        daily: {},
        hourly: {},
      };

      mockShortLinkService.getStats.mockResolvedValue(expectedStats);

      // Act
      const result = await linksController.getStats(alias, undefined, undefined);

      // Assert
      expect(mockShortLinkService.getStats).toHaveBeenCalledWith(
        alias,
        expect.any(String), // Should be 30 days ago
        expect.any(String)  // Should be today
      );
      expect(result).toEqual(expectedStats);
    });

    it('should use default end date when only start date provided', async () => {
      // Arrange
      const alias = 'test123';
      const startDate = '2023-01-01T00:00:00.000Z';
      const expectedStats: StatsResponse = {
        alias: 'test123',
        totalClicks: 25,
        daily: {},
        hourly: {},
      };

      mockShortLinkService.getStats.mockResolvedValue(expectedStats);

      // Act
      const result = await linksController.getStats(alias, startDate, undefined);

      // Assert
      expect(mockShortLinkService.getStats).toHaveBeenCalledWith(
        alias,
        startDate,
        expect.any(String) // Should be today
      );
      expect(result).toEqual(expectedStats);
    });

    it('should use default start date when only end date provided', async () => {
      // Arrange
      const alias = 'test123';
      const endDate = '2023-01-31T23:59:59.999Z';
      const expectedStats: StatsResponse = {
        alias: 'test123',
        totalClicks: 75,
        daily: {},
        hourly: {},
      };

      mockShortLinkService.getStats.mockResolvedValue(expectedStats);

      // Act
      const result = await linksController.getStats(alias, undefined, endDate);

      // Assert
      expect(mockShortLinkService.getStats).toHaveBeenCalledWith(
        alias,
        expect.any(String), // Should be 30 days ago
        endDate
      );
      expect(result).toEqual(expectedStats);
    });

    it('should handle alias not found in stats', async () => {
      // Arrange
      const alias = 'nonexistent';
      const startDate = '2023-01-01T00:00:00.000Z';
      const endDate = '2023-01-31T23:59:59.999Z';
      const notFoundError = new CustomError(
        new NotFoundError('Alias not found'),
        NOT_FOUND_ERROR,
        'Alias not found'
      );

      mockShortLinkService.getStats.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(linksController.getStats(alias, startDate, endDate)).rejects.toThrow(notFoundError);
    });

    it('should return empty stats for alias with no clicks', async () => {
      // Arrange
      const alias = 'test123';
      const startDate = '2023-01-01T00:00:00.000Z';
      const endDate = '2023-01-31T23:59:59.999Z';
      const emptyStats: StatsResponse = {
        alias: 'test123',
        totalClicks: 0,
        daily: {},
        hourly: {},
      };

      mockShortLinkService.getStats.mockResolvedValue(emptyStats);

      // Act
      const result = await linksController.getStats(alias, startDate, endDate);

      // Assert
      expect(result).toEqual(emptyStats);
    });

    it('should handle invalid date formats gracefully', async () => {
      // Arrange
      const alias = 'test123';
      const invalidStartDate = 'invalid-date';
      const invalidEndDate = 'another-invalid-date';
      const dateError = new Error('Invalid date format');

      mockShortLinkService.getStats.mockRejectedValue(dateError);

      // Act & Assert
      await expect(linksController.getStats(alias, invalidStartDate, invalidEndDate)).rejects.toThrow('Invalid date format');
    });
  });
}); 