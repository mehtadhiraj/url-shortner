import { Knex } from 'knex';
import { Redis } from 'ioredis';
import { Inject, Service } from 'typedi';
import { Model } from 'objection';
import { connect } from './postgresProvider';
import RedisProvider from './RedisProvider';
import { ConsumerInitializer } from '../consumer/ConsumerInitializer';

export interface DataClient {
    postgres: Knex,
    redis: Redis,
}

@Service()
export default class DataProvider {
    private redis: Redis;
    private postgres: Knex;
    constructor(
        @Inject() private readonly consumerInitializer: ConsumerInitializer
    ) {
    }

    public async initDb() {
        try {
            this.postgres = await connect();
            Model.knex(this.postgres);
        } catch (err) {
            console.log(`Error while application startup... ${err}`);
            throw err;
        }
    }

    public async initRedis() {
        try {
            this.redis = await RedisProvider.connect();
        } catch (err) {
            console.log(`Error while application startup... ${err}`);
            throw err;
        }
    }

    public getPostgres() {
        return this.postgres;
    }

    public getRedis() {
        return this.redis;
    }

    public async initRedisConsumer() {
        try {
            await this.consumerInitializer.initialize();
        } catch (err) {
            console.log(`Error while application startup... ${err}`);
            throw err;
        }
    }
}
