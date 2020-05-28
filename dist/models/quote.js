"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const objection_1 = require("objection");
const transaction_1 = require("./transaction");
class Quote extends objection_1.Model {
    static get tableName() {
        return 'quotes';
    }
    static get relationMappings() {
        return {
            transaction: {
                relation: objection_1.Model.BelongsToOneRelation,
                modelClass: transaction_1.Transaction,
                join: {
                    from: 'quotes.transactionRequestId',
                    to: 'transaction.transactionRequestId'
                }
            }
        };
    }
    static createNotFoundError() {
        return new Error('Quote not found');
    }
    isExpired() {
        return new Date(this.expiration) <= new Date(Date.now());
    }
}
exports.Quote = Quote;
//# sourceMappingURL=quote.js.map