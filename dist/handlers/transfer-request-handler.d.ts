import { AdaptorServices } from '../adaptor';
import { TransfersPostRequest } from '../types/mojaloop';
export declare function transferRequestHandler({ ilpService, mojaClient, logger, queueService }: AdaptorServices, transferRequest: TransfersPostRequest, headers: {
    [k: string]: any;
}): Promise<void>;
