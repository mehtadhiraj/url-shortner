import { TSConvict } from 'ts-convict';
import { BaseConfig } from '../config/BaseConfig';

const baseConfig = new TSConvict<BaseConfig>(BaseConfig).load();

const routingControllerOptions = {
    routePrefix: baseConfig.apiRoot,
    defaultErrorHandler: false,
    controllers: [`${__dirname}/../server/controllers/**/*{.js,.ts}`],
    middlewares: [`${__dirname}/../server/middlewares/**/*{.js,.ts}`],
    interceptors: [`${__dirname}/../server/interceptors/**/*{.js,.ts}`],
};

const swaggerRoutingOptions = function () {
    return {
        ...routingControllerOptions,
    };
};

export {
    routingControllerOptions,
    swaggerRoutingOptions,
};
