"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const uuid = require('uuid/v4');
async function transactionRequestResponseHandler({ mojaClient, logger }, transactionRequestResponse, headers, transactionRequestId) {
    try {
        logger.debug(`Transaction Request Response Handler: Received response ${JSON.stringify(transactionRequestResponse)} for transactionRequest ${transactionRequestId}`);
        const transaction = await models_1.Transaction.query().where('transactionRequestId', transactionRequestId).first().throwIfNotFound();
        if (transactionRequestResponse.transactionId) {
            logger.debug('Transaction Request Response Handler: Updating transaction id.');
            const state = transaction.state === models_1.TransactionState.transactionCancelled ? transaction.state : models_1.TransactionState.transactionResponded;
            const previousState = transaction.state === models_1.TransactionState.transactionCancelled ? transaction.previousState : transaction.state;
            await transaction.$query().update({ transactionId: transactionRequestResponse.transactionId, previousState, state });
        }
        if (transactionRequestResponse.transactionRequestState === 'REJECTED') {
            await transaction.$query().modify('updateState', models_1.TransactionState.transactionCancelled);
        }
        if (transaction.scenario === 'REFUND' && transaction.isValid()) {
            logger.debug('Transaction Request Response Handler: Initiating quote request for refund.');
            const quote = await models_1.Quote.query().insertGraphAndFetch({
                id: uuid(),
                transactionRequestId: transaction.transactionRequestId,
                transactionId: transaction.transactionId,
                amount: transaction.amount,
                amountCurrency: transaction.currency
            });
            mojaClient.postQuotes({
                quoteId: quote.id,
                transactionId: transaction.transactionId,
                transactionRequestId: transaction.transactionRequestId,
                payee: transaction.payer,
                payer: transaction.payee,
                amountType: 'RECEIVE',
                amount: {
                    amount: transaction.amount,
                    currency: transaction.currency
                },
                transactionType: {
                    scenario: transaction.scenario,
                    initiator: transaction.initiator,
                    initiatorType: transaction.initiatorType,
                    refundInfo: {
                        originalTransactionId: transaction.originalTransactionId
                    }
                }
            }, headers['fspiop-source']);
        }
    }
    catch (error) {
        logger.error(`Transaction Request Response Handler: Failed to process transaction request response: ${transactionRequestId} from ${headers['fspiop-source']}. ${error.message}`);
        const errorInformation = {
            errorCode: '2001',
            errorDescription: 'Failed to update transactionId'
        };
        await mojaClient.putTransactionRequestsError(transactionRequestId, errorInformation, headers['fspiop-source']);
    }
}
exports.transactionRequestResponseHandler = transactionRequestResponseHandler;
//# sourceMappingURL=transaction-request-response-handler.js.map