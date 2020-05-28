import { Model, RelationMappings } from 'objection';
export declare enum TransferState {
    received = "RECEIVED",
    reserved = "RESERVED",
    committed = "COMMITTED",
    aborted = "ABORTED"
}
export declare class Transfers extends Model {
    id: string;
    transactionRequestId: string;
    quoteId?: string;
    fulfillment: string;
    state: string;
    amount: string;
    currency: string;
    static get tableName(): string;
    static get relationMappings(): RelationMappings;
    static createNotFoundError(): Error;
}
