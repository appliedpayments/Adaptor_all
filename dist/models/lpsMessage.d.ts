import { Model, RelationMappings } from 'objection';
import { Transaction } from './transaction';
export declare enum LegacyMessageType {
    authorizationRequest = "authorizationRequest",
    authorizationResponse = "authorizationRespone",
    financialRequest = "financialRequest",
    financialResponse = "financialResponse",
    reversalRequest = "reversalRequest",
    reversalResponse = "reversalResponse"
}
export declare class LpsMessage extends Model {
    id: string;
    lpsId: string;
    lpsKey: string;
    type: string;
    content: {
        [k: string]: any;
    };
    transactions?: Transaction[];
    static get tableName(): string;
    static get jsonAttributes(): string[];
    static createNotFoundError(): Error;
    static get relationMappings(): RelationMappings;
}
