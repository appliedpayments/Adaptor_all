import { LegacyAuthorizationRequest, LegacyAuthorizationResponse, LegacyFinancialRequest, LegacyFinancialResponse, LegacyReversalRequest, ResponseType, LegacyReversalResponse } from '../types/adaptor-relay-messages';
import { LegacyMessageType } from '../models';
import { Money } from '@mojaloop/sdk-standard-components';
import { LegacyMessage } from '../types/tcpRelay';
import { BaseTcpRelay } from './base-tcp-relay';
export declare class DefaultIso8583_87TcpRelay extends BaseTcpRelay {
    getLpsKey(legacyMessage: LegacyMessage): string;
    handleAuthorizationResponse(authorizationResponse: LegacyAuthorizationResponse): Promise<void>;
    handleFinancialResponse(financialResponse: LegacyFinancialResponse): Promise<void>;
    handleReversalResponse(reversalResponse: LegacyReversalResponse): Promise<void>;
    getMessageType(mti: string): LegacyMessageType;
    calculateFee(legacyMessage: LegacyMessage): Money;
    getMojaloopCurrency(legacyCurrency: string): string;
    getTransactionType(legacyMessage: LegacyMessage): {
        initiatorType: 'DEVICE' | 'AGENT';
        scenario: 'WITHDRAWAL' | 'REFUND';
    };
    getResponseCode(response: ResponseType): string;
    mapFromAuthorizationRequest(lpsMessageId: string, legacyMessage: LegacyMessage): Promise<LegacyAuthorizationRequest>;
    mapToAuthorizationResponse(authorizationResponse: LegacyAuthorizationResponse): Promise<LegacyMessage>;
    mapFromFinancialRequest(lpsMessageId: string, legacyMessage: LegacyMessage): Promise<LegacyFinancialRequest>;
    mapToFinancialResponse(financialResponse: LegacyFinancialResponse): Promise<LegacyMessage>;
    mapFromReversalAdvice(lpsMessageId: string, legacyMessage: LegacyMessage): Promise<LegacyReversalRequest>;
    mapToReversalAdviceResponse(reversalResponse: LegacyReversalResponse): Promise<LegacyMessage>;
}
