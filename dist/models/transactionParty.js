"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const objection_1 = require("objection");
class TransactionParty extends objection_1.Model {
    static get tableName() {
        return 'transactionParties';
    }
    toMojaloopParty() {
        return {
            partyIdInfo: {
                partyIdType: this.identifierType,
                partyIdentifier: this.identifierValue,
                fspId: this.fspId,
                partySubIdOrType: this.subIdOrType
            }
        };
    }
}
exports.TransactionParty = TransactionParty;
//# sourceMappingURL=transactionParty.js.map