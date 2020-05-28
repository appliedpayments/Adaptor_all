import { PartiesTypeIDPutResponse, TransfersIDPutResponse, TransfersPostRequest, TransactionRequestsIDPutResponse, QuotesIDPutResponse, ErrorInformation } from './mojaloop';
export declare type PartiesResponseQueueMessage = {
    partiesResponse: PartiesTypeIDPutResponse;
    partyIdValue: string;
};
export declare type AuthorizationRequestQueueMessage = {
    transactionRequestId: string;
    headers: {
        [k: string]: any;
    };
};
export declare type TransferResponseQueueMessage = {
    transferId: string;
    transferResponse: TransfersIDPutResponse;
    headers: {
        [k: string]: any;
    };
};
export declare type TransferRequestQueueMessage = {
    transferRequest: TransfersPostRequest;
    headers: {
        [k: string]: any;
    };
};
export declare type TransactionRequestResponseQueueMessage = {
    transactionRequestResponse: TransactionRequestsIDPutResponse;
    transactionRequestId: string;
    headers: {
        [k: string]: any;
    };
};
export declare type QuoteResponseQueueMessage = {
    quoteId: string;
    quoteResponse: QuotesIDPutResponse;
    headers: {
        [k: string]: any;
    };
};
export declare enum MojaloopError {
    quote = 0,
    transfer = 1,
    parties = 2,
    transactionRequest = 3,
    authorization = 4
}
export declare type MojaloopErrorQueueMessage = {
    type: MojaloopError;
    typeId: string;
    errorInformation: ErrorInformation;
};
