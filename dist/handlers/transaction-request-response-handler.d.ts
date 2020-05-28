import { TransactionRequestsIDPutResponse } from 'types/mojaloop';
import { AdaptorServices } from '../adaptor';
import { Request } from 'hapi';
export declare function transactionRequestResponseHandler({ mojaClient, logger }: AdaptorServices, transactionRequestResponse: TransactionRequestsIDPutResponse, headers: Request['headers'], transactionRequestId: string): Promise<void>;
