import { RedisStreamsProvider } from "../data/RedisStreamsProvider";

export type StreamMessage = {
    id: string;
    fields: Record<string, string>;
    timestamp: number;
};

export type StreamEntry = {
    name: string;
    messages: StreamMessage[];
}

export interface BaseStreamConsumer {
    start(): Promise<void>;
    stop(): Promise<void>;
}

export interface StreamConsumerOptions {
    streamName: string;
    consumerGroup: string;
    consumerName: string;
    blockTime?: number;
    count?: number;
    startId?: string;
}

export interface StreamProducerOptions {
    streamName: string;
    maxLength?: number;
    approximateMaxLength?: boolean;
}

export interface StreamConsumerMessage {
    streamName: string;
    id: string;
    fields: Record<string, string>;
    timestamp: number;
}

export interface StreamConsumerGroup {
    name: string;
    consumers: number;
    pending: number;
    lastDeliveredId: string;
}

export interface StreamInfo {
    length: number;
    radixTreeKeys: number;
    radixTreeNodes: number;
    groups: number;
    lastGeneratedId: string;
    firstEntry?: StreamMessage;
    lastEntry?: StreamMessage;
}

export interface DeadLetterQueueOptions {
    streamName: string;
    maxRetries: number;
    retryDelay?: number;
}

export type ConsumerOptions = {
  streamKey: string;
  group: string;
  handler: (msgs: StreamMessage[]) => Promise<void>;
  provider: RedisStreamsProvider;
  dlqKey?: string;         // default: `${streamKey}:dlq`
  maxRetries?: number;     // default: 3
  readCount?: number;      // default: 10
  readBlockMs?: number;    // default: 5_000
  retryKeyTtlSec?: number; // default: 86400
  consumerName?: string;   // default: auto
};