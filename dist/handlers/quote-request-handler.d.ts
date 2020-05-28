import { Request } from 'hapi';
import { QuotesPostRequest } from '../types/mojaloop';
import { AdaptorServices } from '../adaptor';
export declare function quotesRequestHandler({ calculateAdaptorFees, mojaClient, ilpService, logger, queueService }: AdaptorServices, quoteRequest: QuotesPostRequest, headers: Request['headers']): Promise<void>;
