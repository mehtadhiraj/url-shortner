import { Config, Property } from 'ts-convict';
import { config } from '../server/types';
import { Postgres } from './Database';
import { Redis } from './Redis';

@Config()
export class BaseConfig implements config.BaseConfig {
    // ts-convict will use the Typescript type if no format given
    @Property({
        doc: 'Mode of Server',
        default: 'CONSUMER', // APP, CONSUMER, CRON
        env: 'DEPLOYMENT_TYPE',
    })
    public mode: string;


    @Property({
        doc: 'show stack trace in error',
        format: Boolean,
        default: false,
        env: 'PRINT_STACK_TRACE',
        arg: 'print_stack_trace',
    })
    public printStackTrace: boolean;



    @Property({
        doc: 'Node Environment',
        format: String,
        default: 'development',
        env: 'NODE_ENV',
        arg: 'node_env',
        })
        public nodeEnv: string;

    @Property({
        doc: 'Shortlink Alias Length',
        format: Number,
        default: 10,
        env: 'SHORTLINK_ALIAS_LENGTH',
        arg: 'shortlink_alias_length',
    })
    public shortlinkAliasLength: number;

    @Property({
        doc: 'App base url',
        format: String,
        default: 'http://localhost:3000',
        env: 'APP_BASE_URL',
        arg: 'app_base_url',
    })
    public appBaseUrl: string;

    @Property({
        doc: 'Port',
        format: Number,
        default: 8500,
        env: 'PORT',
        arg: 'port',
    })
    public port: number;

    @Property({
        doc: 'Hostname',
        format: String,
        default: 'http://localhost',
        env: 'HOSTNAME',
        arg: 'hostname',
    })
    public hostname: string;

    @Property({
        doc: 'Api Root',
        format: String,
        default: '',
        env: 'API_ROOT',
        arg: 'api_root',
    })
    public apiRoot: string;

    @Property({
        doc: 'Consumer Name',
        format: String,
        default: 'ClickConsumer',
        env: 'CONSUMER_NAME',
        arg: 'consumer_name',
    })
    public consumerName: string;

    @Property(Postgres)
    public db: config.Postgres;

    @Property(Redis)
    public redis: config.Redis;

}
