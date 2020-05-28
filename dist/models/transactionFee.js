"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const objection_1 = require("objection");
class TransactionFee extends objection_1.Model {
    static get tableName() {
        return 'transactionFees';
    }
}
exports.TransactionFee = TransactionFee;
//# sourceMappingURL=transactionFee.js.map