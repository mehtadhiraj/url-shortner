import 'reflect-metadata';
import 'module-alias/register';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import Container from 'typedi';
import { useContainer as routingContainer } from 'routing-controllers';
import * as http from 'http';
import { Logger } from '../libs/logs/logger';
import { ServerConfig } from './server/Server';
import { BaseConfig } from './config/BaseConfig';
import { TSConvict } from 'ts-convict';

const expressApp = express();
const config = new TSConvict<BaseConfig>(BaseConfig).load();

expressApp.use(bodyParser.urlencoded({ extended: false }));
expressApp.use(bodyParser.json());
routingContainer(Container);
Container.get(ServerConfig).configureServer(expressApp);
const server = http.createServer(expressApp);
server.listen(config.port, () => {
    Logger.info(`Application running on ${config.hostname}:${config.port}`);
});

// Handling the unHandledRejection errors
process.on('unhandledRejection', (error) => {
    Logger.error(`unhandledRejectionError: ${error}`);
});
export default server;
