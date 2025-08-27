import { Response } from 'express';
import { Logger } from '../../../libs/logs/logger';
import { CustomError as CustomErrorType } from '../../types/error';

export default class Responder {
    public static sendSuccess(response: Response, body: { [key: string]: unknown }, statusCode = 200) {
        return response.status(statusCode).json(body);
    }

    public static sendError(response: Response, error: CustomErrorType) {
        Logger.error(`Error: ${error.code} - ${error.message}`);
        const errorObject = error.getObject();
        return response.status(errorObject.status).json(errorObject);
    }
}
