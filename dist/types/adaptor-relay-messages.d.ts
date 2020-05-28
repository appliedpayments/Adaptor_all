import { Money } from './mojaloop';
export declare enum ResponseType {
    approved = 0,
    invalid = 1,
    noPayerFound = 2,
    payerFSPRejected = 3
}
export declare type LegacyAuthorizationRequest = {
    lpsId: string;
    lpsKey: string;
    lpsAuthorizationRequestMessageId: string;
    payer: {
        partyIdType: 'MSISDN';
        partyIdentifier: string;
    };
    payee: {
        partyIdType: 'DEVICE';
        partyIdentifier: string;
        partySubIdOrType: string;
    };
    amount: Money;
    expiration: string;
    lpsFee?: Money;
    transactionType: {
        scenario: 'WITHDRAWAL' | 'REFUND';
        initiatorType: 'AGENT' | 'DEVICE';
    };
};
export declare type LegacyAuthorizationResponse = {
    lpsAuthorizationRequestMessageId: string;
    response: ResponseType;
    transferAmount?: Money;
    fees?: Money;
};
export declare type LegacyFinancialRequest = {
    lpsId: string;
    lpsKey: string;
    lpsFinancialRequestMessageId: string;
    authenticationInfo?: {
        authenticationType: string;
        authenticationValue: string;
    };
    responseType: 'ENTERED' | 'REJECTED';
};
export declare type LegacyFinancialResponse = {
    lpsFinancialRequestMessageId: string;
    response: ResponseType;
};
export declare type LegacyReversalRequest = {
    lpsId: string;
    lpsKey: string;
    lpsFinancialRequestMessageId: string;
    lpsReversalRequestMessageId: string;
};
export declare type LegacyReversalResponse = {
    lpsReversalRequestMessageId: string;
    response: ResponseType;
};
