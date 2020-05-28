import { Request } from 'hapi';
import { QuotesIDPutResponse } from '../types/mojaloop';
import { AdaptorServices } from '../adaptor';
export declare function quoteResponseHandler({ mojaClient, ilpService, logger }: AdaptorServices, quoteResponse: QuotesIDPutResponse, quoteId: string, headers: Request['headers']): Promise<void>;
