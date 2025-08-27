import { TSConvict } from 'ts-convict';
import { Inject, Service } from 'typedi';
import { useExpressServer } from 'routing-controllers';
import DataProvider from '../data/DataProvider';
import { BaseConfig } from '../config/BaseConfig';
import { routingControllerOptions } from '../utils/RoutingConfig';
import { useSwagger } from '../utils/swagger';

@Service()
export class ServerConfig {
    constructor(@Inject() private dataProvider: DataProvider) {}

    public configureServer(expressApp) {
        const myConfigLoader = new TSConvict<BaseConfig>(BaseConfig);
        const config = myConfigLoader.load();
        switch (config.mode) {
            case 'APP': {
                useExpressServer(expressApp, routingControllerOptions);
                useSwagger(expressApp);
                this.dataProvider.initDb();
                this.dataProvider.initRedis();
                break;
            }

            case 'CONSUMER': {
                useExpressServer(expressApp);
                this.dataProvider.initDb();
                this.dataProvider.initRedis();
                this.dataProvider.initRedisConsumer();
                break;
            }
            default:
        }
    }
}
