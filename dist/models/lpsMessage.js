"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const objection_1 = require("objection");
const transaction_1 = require("./transaction");
var LegacyMessageType;
(function (LegacyMessageType) {
    LegacyMessageType["authorizationRequest"] = "authorizationRequest";
    LegacyMessageType["authorizationResponse"] = "authorizationRespone";
    LegacyMessageType["financialRequest"] = "financialRequest";
    LegacyMessageType["financialResponse"] = "financialResponse";
    LegacyMessageType["reversalRequest"] = "reversalRequest";
    LegacyMessageType["reversalResponse"] = "reversalResponse";
})(LegacyMessageType = exports.LegacyMessageType || (exports.LegacyMessageType = {}));
class LpsMessage extends objection_1.Model {
    static get tableName() {
        return 'lpsMessages';
    }
    static get jsonAttributes() {
        return ['content'];
    }
    static createNotFoundError() {
        return new Error('LPS Message not found');
    }
    static get relationMappings() {
        return {
            transactions: {
                relation: objection_1.Model.ManyToManyRelation,
                modelClass: transaction_1.Transaction,
                join: {
                    from: 'lpsMessages.id',
                    through: {
                        from: 'transactionsLpsMessages.lpsMessageId',
                        to: 'transactionsLpsMessages.transactionRequestId'
                    },
                    to: 'transactions.transactionRequestId'
                }
            }
        };
    }
}
exports.LpsMessage = LpsMessage;
//# sourceMappingURL=lpsMessage.js.map