import 'reflect-metadata';
import { BaseConfig } from "../config/BaseConfig";
import { Inject, Service } from "typedi";
import { TSConvict } from "ts-convict";
import { ClickStreamConsumer } from "./ClickStreamConsumer";
import { StreamKey } from "../server/constants/enums";
import { RedisStreamsProvider } from "../data/RedisStreamsProvider";
import { StreamMessage } from '../types/streams';
import { ShortLinkService } from '../server/services/links/ShortlinkService';

@Service()
export class ConsumerInitializer {
    private config: BaseConfig;
    constructor(
        @Inject() private readonly redisStreamsProvider: RedisStreamsProvider,
        @Inject() private readonly shortLinkService: ShortLinkService,
    ) {
        this.config = new TSConvict<BaseConfig>(BaseConfig).load();
    }

    public async initialize() {
        switch(this.config.consumerName) {
            case 'ClickConsumer':
                const clickCosumer = new ClickStreamConsumer({
                    streamKey: StreamKey.SHORTLINK_CLICK,
                    group: StreamKey.SHORTLINK_CLICK_GROUP,
                    handler: async (msgs: StreamMessage[]) => {
                        await this.shortLinkService.recordEvent(msgs);
                    },
                    provider: this.redisStreamsProvider,
                    maxRetries: this.config.redis.streams.maxRetries,
                    readCount: this.config.redis.streams.readCount,
                    consumerName: this.config.consumerName,
                });
                await clickCosumer.start();
                break;
            default:
                throw new Error(`Consumer ${this.config.consumerName} not found`);
        }
    }
}