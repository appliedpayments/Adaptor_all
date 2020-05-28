import { Model } from 'objection';
export declare class TransactionFee extends Model {
    id: string;
    transactionRequestId: string;
    type: string;
    amount: string;
    currency: string;
    static get tableName(): string;
}
