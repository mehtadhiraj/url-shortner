import Knex from 'knex';
import { TSConvict } from 'ts-convict';
import { Postgres } from '../config/Database';

const dbLoader = new TSConvict<Postgres>(Postgres);

const dbConfig: Postgres = dbLoader.load();

/**
 * Initialize a new Postgres provider
 */
const connect = async () => Knex({
    client: 'pg',
    connection: dbConfig.url,
    debug: false,
    pool: {
        min: dbConfig.poolMin,
        max: dbConfig.poolMax,
        idleTimeoutMillis: dbConfig.poolIdle,
    },
    acquireConnectionTimeout: 2000,
});

export { connect };
