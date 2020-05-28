import { AdaptorServices } from '../adaptor';
export declare function authorizationRequestHandler({ queueService, logger, authorizationsService }: AdaptorServices, transactionRequestId: string, headers: {
    [k: string]: any;
}): Promise<void>;
