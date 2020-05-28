import { AdaptorServices } from '../adaptor';
import { TransfersIDPutResponse } from '../types/mojaloop';
export declare function transferResponseHandler({ queueService, logger }: AdaptorServices, transferResponse: TransfersIDPutResponse, headers: {
    [k: string]: any;
}, transferId: string): Promise<void>;
