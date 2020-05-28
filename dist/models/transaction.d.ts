import { Model, RelationMappings, QueryBuilder } from 'objection';
import { TransactionFee } from './transactionFee';
import { TransactionParty } from './transactionParty';
import { LpsMessage } from './lpsMessage';
import { Quote } from './quote';
import { Transfers } from './transfer';
export declare enum TransactionState {
    transactionReceived = "01",
    transactionSent = "02",
    transactionResponded = "03",
    quoteReceived = "04",
    quoteResponded = "05",
    authReceived = "06",
    authSent = "07",
    financialRequestReceived = "08",
    financialRequestSent = "09",
    transferReceived = "0A",
    fulfillmentSent = "0B",
    fulfillmentResponse = "0C",
    financialResponse = "0D",
    transactionDeclined = "0E",
    transactionCancelled = "0F"
}
export declare class Transaction extends Model {
    transactionRequestId: string;
    lpsId: string;
    lpsKey: string;
    transactionId?: string;
    originalTransactionId?: string;
    amount: string;
    currency: string;
    scenario: string;
    initiatorType: string;
    initiator: string;
    expiration: string;
    state: string;
    previousState?: string;
    authenticationType: string;
    fees?: TransactionFee[];
    payer?: TransactionParty;
    payee?: TransactionParty;
    lpsMessages?: LpsMessage[];
    quote?: Quote;
    transfer?: Transfers;
    static get tableName(): string;
    static get idColumn(): string;
    static get relationMappings(): RelationMappings;
    static modifiers: {
        incomplete(query: QueryBuilder<Transaction, Transaction[]>, lpsKey: string): void;
        payerMsisdn(query: QueryBuilder<Transaction, Transaction[]>, msisdn: string): void;
        updateState(query: QueryBuilder<Transaction, Transaction[]>, newState: string): void;
    };
    static createNotFoundError(): Error;
    isValid(): boolean;
    isRefund(): boolean;
}
