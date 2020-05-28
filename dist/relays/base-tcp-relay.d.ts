/// <reference types="node" />
import { Server, Socket } from 'net';
import { Worker, ConnectionOptions } from 'bullmq';
import { QueueService } from '../services/queue-service';
import { Logger } from '../adaptor';
import { LegacyAuthorizationRequest, LegacyAuthorizationResponse, LegacyFinancialRequest, LegacyFinancialResponse, LegacyReversalRequest, ResponseType, LegacyReversalResponse } from '../types/adaptor-relay-messages';
import { LegacyMessageType } from '../models';
import { Money } from '@mojaloop/sdk-standard-components';
import { TcpRelay, LegacyMessage } from '../types/tcpRelay';
import { ResponseCodes, TcpRelayServices, TcpRelayConfig } from '../types/tcpRelay';
export declare class BaseTcpRelay implements TcpRelay {
    protected _logger: Logger;
    protected _queueService: QueueService;
    protected _lpsId: string;
    protected _transactionExpiryWindow: number;
    protected _redisConnection: ConnectionOptions;
    protected _server?: Server;
    protected _socket: Socket;
    protected _encode: (message: {
        [k: string]: any;
    }) => Buffer;
    protected _decode: (message: Buffer) => {
        [k: string]: any;
    };
    protected _authorizationResponseWorker?: Worker;
    protected _financialResponseWorker?: Worker;
    protected _reversalResponseWorker?: Worker;
    protected _responseCodes: ResponseCodes;
    constructor({ logger, queueService, encode, decode, socket }: TcpRelayServices, { lpsId, transactionExpiryWindow, redisConnection, responseCodes }: TcpRelayConfig);
    start(): Promise<void>;
    shutdown(): Promise<void>;
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
