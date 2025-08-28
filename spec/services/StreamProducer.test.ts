import 'reflect-metadata';
import { StreamProducer } from '../../app/server/services/StreamProducer';
import RedisStreamsProvider from '../../app/data/RedisStreamsProvider';
import RedisProvider from '../../app/data/RedisProvider';
import { StreamProducerOptions } from '../../app/types/streams';
import { Logger } from '../../libs/logs/logger';

// Mock dependencies
jest.mock('../../app/data/RedisStreamsProvider');
jest.mock('../../app/data/RedisProvider');
jest.mock('../../libs/logs/logger');

const mockRedisStreamsProvider = {
  addToStream: jest.fn(),
  readFromStream: jest.fn(),
  createConsumerGroup: jest.fn(),
} as unknown as jest.Mocked<RedisStreamsProvider>;

const mockRedisProvider = {
  getRedisInstance: jest.fn(),
};

describe('StreamProducer', () => {
  let streamProducer: StreamProducer;

  beforeEach(() => {
    jest.clearAllMocks();
    (RedisProvider.getRedisInstance as jest.Mock).mockResolvedValue({});
    streamProducer = new StreamProducer(mockRedisStreamsProvider);
  });

  describe('publishMessage', () => {
    it('should publish message to Redis stream successfully', async () => {
      // Arrange
      const streamName = 'test-stream';
      const fields = {
        alias: 'test123',
        url: 'https://example.com',
        eventType: 'click',
      };
      const messageId = '1234567890-0';
      
      mockRedisStreamsProvider.addToStream.mockResolvedValue(messageId);

      // Act
      const result = await streamProducer.publishMessage(streamName, fields);

      // Assert
      expect(mockRedisStreamsProvider.addToStream).toHaveBeenCalledWith(streamName, fields, undefined);
      expect(Logger.info).toHaveBeenCalledWith(`Publishing message to stream ${streamName}`);
      expect(Logger.info).toHaveBeenCalledWith(`Message published to stream ${streamName} with ID: ${messageId}`);
      expect(result).toBe(messageId);
    });

    it('should publish message with options', async () => {
      // Arrange
      const streamName = 'test-stream';
      const fields = {
        alias: 'test123',
        url: 'https://example.com',
        eventType: 'click',
      };
      const options: StreamProducerOptions = {
        streamName: 'test-stream',
        maxLength: 1000,
        approximateMaxLength: true,
      };
      const messageId = '1234567890-0';
      
      mockRedisStreamsProvider.addToStream.mockResolvedValue(messageId);

      // Act
      const result = await streamProducer.publishMessage(streamName, fields, options);

      // Assert
      expect(mockRedisStreamsProvider.addToStream).toHaveBeenCalledWith(streamName, fields, options);
      expect(result).toBe(messageId);
    });

    it('should handle empty fields object', async () => {
      // Arrange
      const streamName = 'test-stream';
      const fields = {};
      const messageId = '1234567890-0';
      
      mockRedisStreamsProvider.addToStream.mockResolvedValue(messageId);

      // Act
      const result = await streamProducer.publishMessage(streamName, fields);

      // Assert
      expect(mockRedisStreamsProvider.addToStream).toHaveBeenCalledWith(streamName, fields, undefined);
      expect(result).toBe(messageId);
    });

    it('should handle Redis stream errors and log them', async () => {
      // Arrange
      const streamName = 'test-stream';
      const fields = {
        alias: 'test123',
        url: 'https://example.com',
        eventType: 'click',
      };
      const streamError = new Error('Redis stream write failed');
      
      mockRedisStreamsProvider.addToStream.mockRejectedValue(streamError);

      // Act & Assert
      await expect(streamProducer.publishMessage(streamName, fields)).rejects.toThrow('Redis stream write failed');
      expect(Logger.info).toHaveBeenCalledWith(`Publishing message to stream ${streamName}`);
      expect(Logger.error).toHaveBeenCalledWith(`Failed to publish message to stream ${streamName}: Redis stream write failed`);
    });

    it('should handle large message payloads', async () => {
      // Arrange
      const streamName = 'test-stream';
      const largeFields = {
        alias: 'test123',
        url: 'https://example.com',
        data: 'x'.repeat(10000), // Large data field
        eventType: 'click',
      };
      const messageId = '1234567890-0';
      
      mockRedisStreamsProvider.addToStream.mockResolvedValue(messageId);

      // Act
      const result = await streamProducer.publishMessage(streamName, largeFields);

      // Assert
      expect(mockRedisStreamsProvider.addToStream).toHaveBeenCalledWith(streamName, largeFields, undefined);
      expect(result).toBe(messageId);
    });
  });
}); 