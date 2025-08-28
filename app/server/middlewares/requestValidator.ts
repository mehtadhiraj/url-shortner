import { BadRequestError, ExpressMiddlewareInterface } from "routing-controllers";
import { ShortlinkRepository } from "../repositories/ShortlinkRepository";
import { CreateShortLinkRequest, CustomError } from "../../types";
import { Inject } from "typedi";
import { Service } from "typedi";
import * as _ from 'lodash';
import { Request, Response } from "express";
import { BAD_REQUEST_ERROR, CONFLICT_ERROR } from "../constants/ErrorCode";
import { BaseConfig } from "../../config/BaseConfig";
import { TSConvict } from "ts-convict";
import * as moment from "moment";

@Service()
export class CreateShortLinkRequestValidator implements ExpressMiddlewareInterface {
    @Inject()
    private readonly shortlinkRepository: ShortlinkRepository;
    private readonly config: BaseConfig = new TSConvict<BaseConfig>(BaseConfig).load();
    async use(request: Request, response: Response, next?: (err?: any) => any): Promise<void | Response> {
        const { vanity }: CreateShortLinkRequest = request.body;
        if (_.isEmpty(vanity)) {
            return next();
        } else {
            const shortlink = await this.shortlinkRepository.findByAlias(vanity);
            if (!_.isEmpty(shortlink)) {
                throw new CustomError(new BadRequestError(), CONFLICT_ERROR, 'Vanity is already taken');
            }
            return next();
        }
    }
}

@Service()
export class GetStatsRequestValidator implements ExpressMiddlewareInterface {
    async use(request: Request, response: Response, next?: (err?: any) => any): Promise<void | Response> {
        let { startDate, endDate }: { startDate: string, endDate: string } = request.query as any;
         // if startDate is not provided, set it to 1 month ago
         if (!startDate) {
            startDate = moment().subtract(30, 'days').toISOString();
            request.query.startDate = startDate;
        } else {
            // check is date valid 
            if (!moment(startDate).isValid()) {
                throw new CustomError(new BadRequestError(), BAD_REQUEST_ERROR, 'Invalid start date. Expected format: YYYY-MM-DD HH:mm:ss');
            }
        }
        // if endDate is not provided, set it to today
        if (!endDate) {
            endDate = moment().toISOString();
            request.query.endDate = endDate;
        } else {
            // check is date valid 
            if (!moment(endDate).isValid()) {
                throw new CustomError(new BadRequestError(), BAD_REQUEST_ERROR, 'Invalid end date. Expected format: YYYY-MM-DD HH:mm:ss');
            }
        }
        return next();
    }
}
