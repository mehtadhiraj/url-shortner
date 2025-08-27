import { BadRequestError, ExpressErrorMiddlewareInterface, ForbiddenError, HttpError, Middleware, NotFoundError, UnauthorizedError } from 'routing-controllers';
import { Request, Response } from 'express';
import { TSConvict } from 'ts-convict';
import { Service } from 'typedi';
import { BaseConfig } from '../../config/BaseConfig';
import { CustomError } from '../../types/error';
import Responder from '../Responder/Responder';
import { Logger } from '../../../libs/logs/logger';
import { BAD_REQUEST_ERROR, FORBIDDEN_ERROR, INTERNAL_SERVER_ERROR, NOT_FOUND_ERROR, UNAUTHORIZED_ERROR } from '../constants/ErrorCode';
import { ValidationError } from 'class-validator';

const myConfigLoader = new TSConvict<BaseConfig>(BaseConfig);
const config = myConfigLoader.load();

@Service()
@Middleware({ type: 'after' })
export class ErrorValidator implements ExpressErrorMiddlewareInterface {
    error(error: Error & { errors: Error[], validationErrors?: ValidationError[] }, request: Request, response: Response, next?: (err?: Error) => void): void {
        Logger.error(`Error: ${error.message}, errors: ${JSON.stringify(error.errors || error.validationErrors)}, stacktrace: ${error.stack}`);
        if (!(error instanceof CustomError) && !(error instanceof HttpError)) {
            error = new CustomError(error, INTERNAL_SERVER_ERROR);
        } else if (error instanceof HttpError) {
            if (error instanceof BadRequestError) {
                const newError = new CustomError(error, BAD_REQUEST_ERROR);
                const errors = error.errors || error.validationErrors;
                if (errors) {
                    newError.message = errors.map((err) => {
                        const constraints = Object.values(err.constraints || {});
                        return constraints.join(', ');
                    }).join(', ');
                } else {
                    newError.message = error.message || newError.message;
                }
                error = newError;
            } else if (error instanceof NotFoundError) {
                error = new CustomError(error, NOT_FOUND_ERROR);
            } else if (error instanceof UnauthorizedError) {
                error = new CustomError(error, UNAUTHORIZED_ERROR);
            } else if (error instanceof ForbiddenError) {
                error = new CustomError(error, FORBIDDEN_ERROR);
            } else {
                error = new CustomError(error, INTERNAL_SERVER_ERROR);
            }
        }
        next(error);
    }
}

@Service()
@Middleware({ type: 'after' })
export class ErrorResponder implements ExpressErrorMiddlewareInterface {
    error(error: CustomError, request: Request, response: Response): Response {
        if (!config.printStackTrace) {
            delete error.stackTrace;
            delete error.exception;
        }
        return Responder.sendError(response, error);
    }
}