import { Model, RelationMappings } from 'objection';
export declare class Quote extends Model {
    id: string;
    transactionRequestId: string;
    transactionId?: string;
    amount: string;
    amountCurrency: string;
    feeAmount: string;
    feeCurrency: string;
    commissionAmount?: string;
    commissionCurrency?: string;
    transferAmount: string;
    transferAmountCurrency: string;
    ilpPacket: string;
    condition: string;
    expiration: string;
    static get tableName(): string;
    static get relationMappings(): RelationMappings;
    static createNotFoundError(): Error;
    isExpired(): boolean;
}
