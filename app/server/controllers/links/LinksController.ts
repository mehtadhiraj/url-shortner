import { Body, Get, JsonController, Param, Post, QueryParam, Res, UseBefore } from "routing-controllers";
import { CreateShortLinkRequest, CreateShortLinkResponse, CustomError, ResolveAliasResponse, StatsResponse } from "../../../types";
import { Inject, Service } from "typedi";
import { ShortLinkService } from "../../services/links/ShortlinkService";
import { Logger } from "../../../../libs/logs/logger";
import { ResponseSchema } from "routing-controllers-openapi";
import { CreateShortLinkRequestValidator, GetStatsRequestValidator } from "../../middlewares/requestValidator";
import { Response } from "express";
import RedisLock from "../../decorators/RedisLock";
import { RedisPrefix } from "../../constants/enums";
import * as moment from "moment";

@JsonController()
@Service()
export class LinksController {

    constructor(
        @Inject() private readonly shortLinkService: ShortLinkService,
    ){}

    @Post('/links')
    @ResponseSchema(CreateShortLinkResponse, {
        statusCode: 200,
        description: 'Link created Successfully'
    })
    @ResponseSchema(CustomError, {statusCode: 400, description: 'Bad Request'})
    @ResponseSchema(CustomError, {statusCode: 500, description: 'Internal server error'})
    @UseBefore(CreateShortLinkRequestValidator)
    @RedisLock(RedisPrefix.SHORTLINK, {
        appendKeyInfos: [{
            path: 'campaignId',
            argIndex: 0,
        }],
        threshold: 10,
        expire: 60,
        deleteConfig: {
            onError: true,
        },
    })
    async createLink(@Body() request: CreateShortLinkRequest): Promise<CreateShortLinkResponse> {
        try {
            const response: CreateShortLinkResponse = await this.shortLinkService.createShortLink(request);
            return response;   
        } catch (error) {
            Logger.error(`Error while creating link: ${error}`);
            throw error;
        }
    }

    @Get('/:alias')
    @ResponseSchema(ResolveAliasResponse, {
        statusCode: 200,
        description: 'Link fetched Successfully'
    })
    @ResponseSchema(CustomError, {statusCode: 400, description: 'Bad Request'})
    @ResponseSchema(CustomError, {statusCode: 500, description: 'Internal server error'})
    async getLink(@Param('alias') alias: string, @Res() response: Response): /**Promise<void>*/ Promise<ResolveAliasResponse> {
        try {
            const resolveAliasResponse: ResolveAliasResponse = await this.shortLinkService.resolveAlias(alias);
            // return response.status(302).redirect(resolveAliasResponse.url);
            return resolveAliasResponse;
        } catch (error) {
            Logger.error(`Error while resolving alias: ${error}`);
            throw error;
        }
    }

    @Get('/links/:alias/stats')
    @ResponseSchema(StatsResponse, {
        statusCode: 200,
        description: 'Link stats fetched Successfully'
    })
    @ResponseSchema(CustomError, {statusCode: 400, description: 'Bad Request'})
    @ResponseSchema(CustomError, {statusCode: 500, description: 'Internal server error'})
    @UseBefore(GetStatsRequestValidator)
    async getStats(
        @Param('alias') alias: string,
        @QueryParam('startDate') startDate: string,
        @QueryParam('endDate') endDate: string
    ): Promise<StatsResponse> {
        try {
            if(!startDate) {
                startDate = moment().subtract(30, 'days').toISOString();
            }
            if(!endDate) {
                endDate = moment().toISOString();
            }
            const stats: StatsResponse = await this.shortLinkService.getStats(alias, startDate, endDate);
            return stats;
        } catch (error) {
            Logger.error(`Error while resolving alias: ${error}`);
            throw error;
        }
    }
}