"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const objection_1 = require("objection");
const transactionFee_1 = require("./transactionFee");
const transactionParty_1 = require("./transactionParty");
const lpsMessage_1 = require("./lpsMessage");
const quote_1 = require("./quote");
const transfer_1 = require("./transfer");
var TransactionState;
(function (TransactionState) {
    TransactionState["transactionReceived"] = "01";
    TransactionState["transactionSent"] = "02";
    TransactionState["transactionResponded"] = "03";
    TransactionState["quoteReceived"] = "04";
    TransactionState["quoteResponded"] = "05";
    TransactionState["authReceived"] = "06";
    TransactionState["authSent"] = "07";
    TransactionState["financialRequestReceived"] = "08";
    TransactionState["financialRequestSent"] = "09";
    TransactionState["transferReceived"] = "0A";
    TransactionState["fulfillmentSent"] = "0B";
    TransactionState["fulfillmentResponse"] = "0C";
    TransactionState["financialResponse"] = "0D";
    TransactionState["transactionDeclined"] = "0E";
    TransactionState["transactionCancelled"] = "0F";
})(TransactionState = exports.TransactionState || (exports.TransactionState = {}));
class Transaction extends objection_1.Model {
    static get tableName() {
        return 'transactions';
    }
    static get idColumn() {
        return 'transactionRequestId';
    }
    static get relationMappings() {
        return {
            fees: {
                relation: objection_1.Model.HasManyRelation,
                modelClass: transactionFee_1.TransactionFee,
                join: {
                    from: 'transactions.transactionRequestId',
                    to: 'transactionFees.transactionRequestId'
                }
            },
            payer: {
                relation: objection_1.Model.HasOneRelation,
                modelClass: transactionParty_1.TransactionParty,
                join: {
                    from: 'transactions.transactionRequestId',
                    to: 'transactionParties.transactionRequestId'
                },
                filter: { 'transactionParties.type': 'payer' }
            },
            payee: {
                relation: objection_1.Model.HasOneRelation,
                modelClass: transactionParty_1.TransactionParty,
                join: {
                    from: 'transactions.transactionRequestId',
                    to: 'transactionParties.transactionRequestId'
                },
                filter: { 'transactionParties.type': 'payee' }
            },
            lpsMessages: {
                relation: objection_1.Model.ManyToManyRelation,
                modelClass: lpsMessage_1.LpsMessage,
                join: {
                    from: 'transactions.transactionRequestId',
                    through: {
                        from: 'transactionsLpsMessages.transactionRequestId',
                        to: 'transactionsLpsMessages.lpsMessageId'
                    },
                    to: 'lpsMessages.id'
                }
            },
            quote: {
                relation: objection_1.Model.HasOneRelation,
                modelClass: quote_1.Quote,
                join: {
                    from: 'transactions.transactionRequestId',
                    to: 'quotes.transactionRequestId'
                }
            },
            transfer: {
                relation: objection_1.Model.HasOneRelation,
                modelClass: transfer_1.Transfers,
                join: {
                    from: 'transactions.transactionRequestId',
                    to: 'transfers.transactionRequestId'
                }
            }
        };
    }
    static createNotFoundError() {
        return new Error('Transaction not found');
    }
    isValid() {
        return this.state !== TransactionState.transactionDeclined && this.state !== TransactionState.transactionCancelled && new Date(Date.now()) < new Date(this.expiration);
    }
    isRefund() {
        return !!this.originalTransactionId;
    }
}
exports.Transaction = Transaction;
Transaction.modifiers = {
    incomplete(query, lpsKey) {
        query.whereNot('state', TransactionState.transactionDeclined)
            .whereNot('state', TransactionState.transactionCancelled)
            .whereNot('state', TransactionState.financialResponse)
            .where('lpsKey', lpsKey);
    },
    payerMsisdn(query, msisdn) {
        query.withGraphJoined('payer')
            .where('payer.identifierType', 'MSISDN')
            .where('payer.identifierValue', msisdn);
    },
    updateState(query, newState) {
        query.onBuildKnex((knexBuilder) => {
            knexBuilder.update({
                previousState: Transaction.knex().ref('state'),
                state: newState
            });
        });
    }
};
//# sourceMappingURL=transaction.js.map