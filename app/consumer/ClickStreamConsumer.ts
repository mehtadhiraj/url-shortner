import { Logger } from '../../libs/logs/logger';
import { RedisStreamsProvider } from '../data/RedisStreamsProvider';
import { BaseStreamConsumer, ConsumerOptions, StreamMessage } from '../types/streams';

export class ClickStreamConsumer implements BaseStreamConsumer{
  private readonly streamKey: string;
  private readonly group: string;
  private readonly handler: (msgs: StreamMessage[]) => Promise<void>;
  private readonly provider: RedisStreamsProvider;
  private readonly dlqKey: string;
  private readonly maxRetries: number;
  private readonly readCount: number;
  private readonly readBlockMs: number;
  private readonly retryKeyTtlSec: number;
  private readonly consumerName: string;

  private running = false;

  constructor(
    opts: ConsumerOptions
) {
    if (!opts.streamKey || !opts.group || !opts.handler) {
      throw new Error('streamKey, group, handler are required');
    }
    this.streamKey = opts.streamKey;
    this.group = opts.group;
    this.handler = opts.handler;
    this.provider = opts.provider;
    this.dlqKey = opts.dlqKey ?? `${opts.streamKey}:dlq`;
    this.maxRetries = opts.maxRetries ?? 3;
    this.readCount = opts.readCount ?? 10;
    this.readBlockMs = opts.readBlockMs ?? 5_000;
    this.retryKeyTtlSec = opts.retryKeyTtlSec ?? 86_400;
    this.consumerName = opts.consumerName;
  }

  /** Public: connect provider, ensure group, and start loops. */
  public async start(): Promise<void> {
    if (this.running) {
      Logger.warn(`[${this.group}] already running`);
      return;
    }
    await this.provider.createConsumerGroup(this.streamKey, this.group);
    this.running = true;

    this.consumeLoop().catch((err) => {
      Logger.error(`[${this.group}] consume loop fatal: ${err}, stack: ${err.stack}`);
    });
  }

  /** Public: stop loops. */
  public async stop(): Promise<void> {
    this.running = false;
  }

  // ======= Private internals ======= //

  private async consumeLoop(): Promise<void> {
    while (this.running) {
      try {
        const msgs = await this.provider.readFromStream({
            streamName: this.streamKey,
            consumerGroup: this.group,
            consumerName: this.consumerName,
            count: this.readCount,
            blockTime: this.readBlockMs
        });

        if (!msgs.length) continue;

        await this.processMessage(msgs);
      } catch (err: any) {
        Logger.error(`[${this.group}] consume error: ${err}, stack: ${err.stack}`);
        await this.sleep(1000);
      }
    }
  }

  private async processMessage(msgs: StreamMessage[]): Promise<void> {
    const messageIds = msgs.map((msg) => msg.id);
    try {
      await this.handler(msgs);
      await this.provider.ackMessage(this.streamKey, this.group, messageIds);
      await this.clearAttempts(messageIds);
    } catch (err: any) {
      const attempts = await this.bumpAttempts(messageIds);
      Logger.error(`[${this.group}] error ${messageIds.length} (attempt ${attempts}): ${err?.message || err}`);

      if (attempts >= this.maxRetries) {
        await this.deadLetter(msgs, err?.message || 'error');
        await this.provider.ackMessage(this.streamKey, this.group, messageIds); // stop retrying
      }
      // else: keep pending (no ack) — will be retried by reclaim
    }
  }

  private retryKey(id: string): string {
    return `retry:${this.streamKey}:${this.group}:${id}`;
  }

  private async bumpAttempts(ids: string[]): Promise<number> {
    return this.provider.incrWithTtl(ids.map((id) => this.retryKey(id)), this.retryKeyTtlSec);
  }

  private async getAttempts(id: string): Promise<number> {
    return this.provider.getInt(this.retryKey(id));
  }

  private async clearAttempts(ids: string[]): Promise<void> {
    await this.provider.delKey(ids.map((id) => this.retryKey(id)));
  }

  private async deadLetter(msgs: StreamMessage[], error: string): Promise<void> {
    for (const msg of msgs) {
      const attempts = await this.getAttempts(msg.id);
      await this.provider.addToStream(this.dlqKey, {
      orig_stream: this.streamKey,
      group: this.group,
      id: msg.id,
      error: String(error).slice(0, 256),
      attempts: String(attempts),
        ...msg.fields,
      });
      Logger.warn(`[${this.group}] moved ${msg.id} to DLQ (${this.dlqKey})`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
