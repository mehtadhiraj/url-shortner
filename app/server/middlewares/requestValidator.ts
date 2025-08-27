import { BadRequestError, ExpressMiddlewareInterface } from "routing-controllers";
import { ShortlinkRepository } from "../repositories/ShortlinkRepository";
import { CreateShortLinkRequest, CustomError } from "../../types";
import { Inject } from "typedi";
import { Service } from "typedi";
import * as _ from 'lodash';
import { Request, Response } from "express";
import { CONFLICT_ERROR } from "../constants/ErrorCode";
import { BaseConfig } from "../../config/BaseConfig";
import { TSConvict } from "ts-convict";

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
