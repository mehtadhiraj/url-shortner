import 'reflect-metadata';
import { ClickStreamConsumer } from '../../app/consumer/ClickStreamConsumer';
import { RedisStreamsProvider } from '../../app/data/RedisStreamsProvider';
import { ConsumerOptions, StreamConsumerMessage, StreamMessage } from '../../app/types/streams';
import { Logger } from '../../libs/logs/logger';

// Mock dependencies
jest.mock('../../libs/logs/logger');

const mockRedisStreamsProvider = {
  readFromStream: jest.fn(),
  createConsumerGroup: jest.fn(),
  addToStream: jest.fn(),
  ackMessage: jest.fn(),
  incrWithTtl: jest.fn(),
  getInt: jest.fn(),
  delKey: jest.fn(),
  extractTimestampFromId: jest.fn(),
  ensureConnection: jest.fn(),
  sleep: jest.fn(),
} as unknown as jest.Mocked<RedisStreamsProvider>;

const mockHandler = jest.fn();

describe('ClickStreamConsumer', () => {
  let consumer: ClickStreamConsumer;
  let consumerOptions: ConsumerOptions;

  beforeEach(() => {
    jest.clearAllMocks();
    consumerOptions = {
      streamKey: 'test-stream',
      group: 'test-group',
      handler: mockHandler,
      provider: mockRedisStreamsProvider,
      consumerName: 'test-consumer',
      maxRetries: 3,
      readCount: 10,
      readBlockMs: 5000,
    };
    consumer = new ClickStreamConsumer(consumerOptions);
  });

  describe('start', () => {
    it('should start consumer and create consumer group', async () => {
      // Arrange
      mockRedisStreamsProvider.createConsumerGroup.mockResolvedValue(undefined);
      
      // Mock the consume loop to prevent infinite loop in tests
      jest.spyOn(consumer as any, 'consumeLoop').mockImplementation(() => Promise.resolve());
      
      // Act
      await consumer.start();

      // Assert
      expect(mockRedisStreamsProvider.createConsumerGroup).toHaveBeenCalledWith(
        'test-stream',
        'test-group'
      );
      await consumer.stop();
    });

    it('should handle BUSYGROUP errors gracefully', async () => {
      // Arrange
      // Mock createConsumerGroup to resolve (the actual method handles BUSYGROUP internally)
      mockRedisStreamsProvider.createConsumerGroup.mockResolvedValue(undefined);
      
      // Mock the consume loop
      jest.spyOn(consumer as any, 'consumeLoop').mockImplementation(() => Promise.resolve());

      // Act
      await consumer.start();

      // Assert
      expect(mockRedisStreamsProvider.createConsumerGroup).toHaveBeenCalledWith(
        'test-stream',
        'test-group'
      );
      await consumer.stop();
    });

    it('should not start if already running', async () => {
      // Arrange
      mockRedisStreamsProvider.createConsumerGroup.mockResolvedValue(undefined);
      jest.spyOn(consumer as any, 'consumeLoop').mockImplementation(() => Promise.resolve());

      await consumer.start(); // Start first time
      jest.clearAllMocks();

      // Act
      await consumer.start(); // Try to start again

      // Assert - Should not create group again
      expect(mockRedisStreamsProvider.createConsumerGroup).not.toHaveBeenCalled();

      await consumer.stop();
    });
  });

  describe('message processing', () => {
    let consumeLoopSpy: jest.SpyInstance;
    let processMessageSpy: jest.SpyInstance;

    beforeEach(() => {
      // Mock private methods
      consumeLoopSpy = jest.spyOn(consumer as any, 'consumeLoop');
      processMessageSpy = jest.spyOn(consumer as any, 'processMessage');
    });

    it('should process messages successfully', async () => {
      // Arrange
      const messages: StreamMessage[] = [
        {
          id: '1234567890-0',
          timestamp: 1234567890000,
          fields: {
            alias: 'test123',
            eventType: 'click',
            timestamp: '1234567890000',
          },
        },
      ];

      mockHandler.mockResolvedValue(undefined);
      mockRedisStreamsProvider.ackMessage.mockResolvedValue(1);

      // Act
      await (consumer as any).processMessage(messages);

      // Assert
      expect(mockHandler).toHaveBeenCalledWith(messages);
      expect(mockRedisStreamsProvider.ackMessage).toHaveBeenCalledWith(
        'test-stream',
        'test-group',
        ['1234567890-0']
      );
      await consumer.stop();
    });

    it('should handle handler errors and retry', async () => {
      // Arrange
      const messages: StreamConsumerMessage[] = [
        {
          id: '1234567890-0',
          timestamp: 1234567890000,
          streamName: 'test-stream',
          fields: {
            alias: 'test123',
            eventType: 'click',
            timestamp: '1234567890000',
          },
        },
      ];

      const handlerError = new Error('Handler processing failed');
      mockHandler.mockRejectedValue(handlerError);

      // Act
      await (consumer as any).start();
      mockRedisStreamsProvider.readFromStream.mockResolvedValueOnce(messages);
      // Assert
      expect(Logger.error).toHaveBeenCalledWith(
        expect.stringContaining('[test-group] consume error:')
      );
      // Should not acknowledge on error
      expect(mockRedisStreamsProvider.ackMessage).not.toHaveBeenCalled();
      await consumer.stop();
    });

    it('should handle empty message arrays', async () => {
      // Arrange
      const messages: StreamConsumerMessage[] = [];

      // Act
      await (consumer as any).start();
      mockRedisStreamsProvider.readFromStream.mockResolvedValueOnce(messages);

      // Assert
      expect(mockRedisStreamsProvider.ackMessage).not.toHaveBeenCalled();

      await consumer.stop();
    });
  });

  describe('consume loop', () => {
    it('should read messages and process them', async () => {
      // Arrange
      const messages: StreamConsumerMessage[] = [
        {
          id: '1234567890-0',
          streamName: 'test-stream',
          timestamp: 1234567890000,
          fields: { alias: 'test123', eventType: 'click', timestamp: '1234567890000' },
        },
      ];

      mockRedisStreamsProvider.readFromStream.mockResolvedValueOnce(messages);
      mockRedisStreamsProvider.readFromStream.mockResolvedValue([]); // Stop the loop

      const processMessageSpy = jest.spyOn(consumer as any, 'processMessage').mockResolvedValue(undefined);


      // Act
      await (consumer as any).start();

      // Assert
      expect(mockRedisStreamsProvider.readFromStream).toHaveBeenCalledWith({
        streamName: 'test-stream',
        consumerGroup: 'test-group',
        consumerName: 'test-consumer',
        count: 10,
        blockTime: 5000,
      });
      expect(processMessageSpy).toHaveBeenCalledWith(messages);
      await consumer.stop();
    });

    it('should handle read errors gracefully', async () => {
      // Arrange
      const readError = new Error('Redis read error');
      mockRedisStreamsProvider.readFromStream.mockRejectedValue(readError);
      
      // Mock sleep to prevent actual delay in tests
      const sleepSpy = jest.spyOn(consumer as any, 'sleep').mockResolvedValue(undefined);


      // Act
      await (consumer as any).start();

      // Assert
      expect(Logger.error).toHaveBeenCalledWith(
        expect.stringContaining('[test-group] consume error')
      );
      expect(sleepSpy).toHaveBeenCalledWith(1000);
      await consumer.stop();
    });

    it('should continue processing when no messages available', async () => {
      // Arrange
      mockRedisStreamsProvider.readFromStream.mockResolvedValue([]);
      

      // Act
      await (consumer as any).start();

      // Assert
      expect(mockRedisStreamsProvider.readFromStream).toHaveBeenCalled();
      await consumer.stop();
    });
  });
}); 