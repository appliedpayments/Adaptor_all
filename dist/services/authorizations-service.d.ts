import { AxiosInstance } from 'axios';
import Knex from 'knex';
import { AuthorizationsIDPutResponse, ErrorInformation } from '../types/mojaloop';
import { Logger } from '../adaptor';
export interface AuthorizationsService {
    sendAuthorizationsResponse(transactionRequestId: string, response: AuthorizationsIDPutResponse, headers: {
        [k: string]: string | undefined;
    }): Promise<void>;
    sendAuthorizationsErrorResponse(transactionRequestId: string, error: ErrorInformation, headers: {
        [k: string]: string;
    }): Promise<void>;
}
export declare type AuthorizationsServiceOptions = {
    knex: Knex;
    client: AxiosInstance;
    logger?: Logger;
};
export declare class KnexAuthorizationsService implements AuthorizationsService {
    private _knex;
    private _client;
    private _logger;
    constructor(options: AuthorizationsServiceOptions);
    sendAuthorizationsResponse(transactionRequestId: string, request: AuthorizationsIDPutResponse, headers: {
        [k: string]: string;
    }): Promise<void>;
    sendAuthorizationsErrorResponse(transactionRequestId: string, error: ErrorInformation, headers: {
        [k: string]: string | undefined;
    }): Promise<void>;
}
