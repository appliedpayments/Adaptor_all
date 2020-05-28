"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const objection_1 = require("objection");
const transaction_1 = require("./transaction");
var TransferState;
(function (TransferState) {
    TransferState["received"] = "RECEIVED";
    TransferState["reserved"] = "RESERVED";
    TransferState["committed"] = "COMMITTED";
    TransferState["aborted"] = "ABORTED";
})(TransferState = exports.TransferState || (exports.TransferState = {}));
class Transfers extends objection_1.Model {
    static get tableName() {
        return 'transfers';
    }
    static get relationMappings() {
        return {
            transaction: {
                relation: objection_1.Model.BelongsToOneRelation,
                modelClass: transaction_1.Transaction,
                join: {
                    from: 'transfers.transactionRequestId',
                    to: 'transaction.transactionRequestId'
                }
            }
        };
    }
    static createNotFoundError() {
        return new Error('Transfer not found');
    }
}
exports.Transfers = Transfers;
//# sourceMappingURL=transfer.js.map