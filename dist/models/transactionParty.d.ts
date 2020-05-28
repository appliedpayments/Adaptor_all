import { Model } from 'objection';
import { Party } from '../types/mojaloop';
export declare class TransactionParty extends Model {
    id: string;
    type: string;
    identifierType: string;
    identifierValue: string;
    fspId?: string;
    subIdOrType?: string;
    static get tableName(): string;
    toMojaloopParty(): Party;
}
