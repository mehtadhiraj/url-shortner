import { Inject, Service } from "typedi";
import { CreateShortLinkRequest, CreateShortLinkResponse, EventRecordObject, ResolveAliasResponse, StatsResponse, StreamMessage } from "../../../types";
import { ShortlinkRepository } from "../../repositories/ShortlinkRepository";
import { TSConvict } from "ts-convict";
import { BaseConfig } from "../../../config/BaseConfig";
import { NOT_FOUND_ERROR } from "../../constants/ErrorCode";
import { CustomError } from "../../../types/error";
import { NotFoundError } from "routing-controllers";
import * as _ from 'lodash';
import { StreamProducer } from "../StreamProducer";
import { StreamKey } from "../../constants/enums";
import { EventRecordRepository } from "../../repositories/EventRecordRepository";
import * as moment from "moment";

@Service()
export class ShortLinkService {
    private config: BaseConfig;
    constructor(
        @Inject() private readonly shortLinkRepository: ShortlinkRepository,
        @Inject() private readonly eventRecordRepository: EventRecordRepository,
        @Inject() private readonly steamProducer: StreamProducer,
    ) {
        const myConfigLoader: TSConvict<BaseConfig> = new TSConvict<BaseConfig>(BaseConfig);
        this.config = myConfigLoader.load();
    }

    /**
     * Generates a random alias for a short link
     * @param {number} length - The length of the alias
     * @returns {string} - The generated alias
     */
    private generateAlias(length: number = this.config.shortlinkAliasLength): string {
        const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        const base = alphabet.length;

        // Mix timestamp + random into one big integer
        const now = Date.now(); // milliseconds since epoch
        const random = Math.floor(Math.random() * 1e6); // up to 6 digits of randomness
        let num = now * 1e6 + random;

        // Convert to base62
        let str = '';
        while (num > 0 && str.length < length) {
            str = alphabet[num % base] + str;
            num = Math.floor(num / base);
        }

        // If string is shorter than desired length, pad with random characters
        while (str.length < length) {
            str = alphabet[Math.floor(Math.random() * base)] + str;
        }

        return str;
    }

    /**
     * Creates a short link for a given request
     * @param {CreateShortLinkRequest} request - The request object containing the URL, campaign ID, and vanity
     * @returns {Promise<CreateShortLinkResponse>} - The response object containing the alias, short URL, and campaign ID
     */
    async createShortLink(request: CreateShortLinkRequest): Promise<CreateShortLinkResponse> {
        const { url, campaignId, vanity } = request;
        let shortlink = _.isEmpty(vanity) ? await this.shortLinkRepository.findByCampaignIdAndUrl(campaignId, url) : null;
        if(_.isEmpty(shortlink)) {
            shortlink = await this.shortLinkRepository.create({
                url,
                campaignId,
                alias: vanity || this.generateAlias(),
            });
        }
        return {
            alias: shortlink.alias,
            shortUrl: `${this.config.appBaseUrl}/${shortlink.alias}`,
            campaignId,
        }
    }

    /**
     * Resolves an alias to a URL
     * @param {string} alias - The alias to resolve
     * @returns {Promise<ResolveAliasResponse>} - The response object containing the URL and alias
     */
    async resolveAlias(alias: string): Promise<ResolveAliasResponse> {
        const shortlink = await this.shortLinkRepository.findByAlias(alias);
        if (!shortlink) {
            throw new CustomError(new NotFoundError(), NOT_FOUND_ERROR, 'Link not found');
        }
        this.steamProducer.publishMessage(StreamKey.SHORTLINK_CLICK, {
            alias: shortlink.alias,
            url: shortlink.url,
            campaignId: shortlink.campaignId,
            timestamp: new Date().getTime().toString(),
            eventType: 'click',
        });
        return {
            url: shortlink.url,
            alias: shortlink.alias,
        }
    }

    async recordEvent(messages: StreamMessage[]): Promise<void> {
        const records = messages.map(message => ({
            alias: message.fields.alias,
            timestamp: new Date(Number(message.fields.timestamp)).toISOString(),
            eventType: message.fields.eventType,
            eventData: message,
        }));
        await this.eventRecordRepository.bulkCreate(records);
        return;
    }

    async getStats(alias: string, startDate: string, endDate: string): Promise<StatsResponse> {
        const stats: EventRecordObject[] = await this.eventRecordRepository.getStats(alias, startDate, endDate);
        const totalClicks = stats.length;
        const daily = stats.reduce((acc, curr) => {
            const date = moment(curr.timestamp).format('YYYY-MM-DD');
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});
        // start time of each to be as a key for hourly stats
        const hourly = stats.reduce((acc, curr) => {
            const date = moment(curr.timestamp).format('YYYY-MM-DD');
            // hour should not be converted to utc
            const hour = moment(curr.timestamp).utc().format('HH');
            acc[`${date}-${hour}`] = (acc[`${date}-${hour}`] || 0) + 1;
            return acc;
        }, {});
        return {
            alias,
            totalClicks,
            daily,
            hourly,
        };
    }
}