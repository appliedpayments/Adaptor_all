"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const queueMessages_1 = require("../types/queueMessages");
const models_1 = require("../models");
const adaptor_relay_messages_1 = require("../types/adaptor-relay-messages");
async function findTransaction(type, typeId) {
    switch (type) {
        case queueMessages_1.MojaloopError.quote:
            const quote = await models_1.Quote.query().where({ id: typeId }).first().throwIfNotFound();
            return models_1.Transaction.query().where({ transactionRequestId: quote.transactionRequestId }).first().throwIfNotFound();
        case queueMessages_1.MojaloopError.transfer:
            const transfer = await models_1.Transfers.query().where({ id: typeId }).first().throwIfNotFound();
            return models_1.Transaction.query().where({ transactionRequestId: transfer.transactionRequestId }).first().throwIfNotFound();
        default:
            throw new Error('Error response handler: Could not find transaction.');
    }
}
async function errorResponseHandler({ logger, queueService }, { type, typeId }) {
    try {
        const transaction = await findTransaction(type, typeId);
        if (transaction.isValid())
            await transaction.$query().modify('updateState', models_1.TransactionState.transactionCancelled);
        if (!transaction.isRefund() && type === queueMessages_1.MojaloopError.quote) {
            const legacyAuthorizationRequest = await transaction.$relatedQuery('lpsMessages').where({ type: models_1.LegacyMessageType.authorizationRequest }).first().throwIfNotFound();
            const response = {
                lpsAuthorizationRequestMessageId: legacyAuthorizationRequest.id,
                response: adaptor_relay_messages_1.ResponseType.invalid
            };
            await queueService.addToQueue(`${transaction.lpsId}AuthorizationResponses`, response);
        }
        if (!transaction.isRefund() && type === queueMessages_1.MojaloopError.transfer) {
            const legacyFinancialRequest = await transaction.$relatedQuery('lpsMessages').where({ type: models_1.LegacyMessageType.financialRequest }).first().throwIfNotFound();
            const response = {
                lpsFinancialRequestMessageId: legacyFinancialRequest.id,
                response: adaptor_relay_messages_1.ResponseType.invalid
            };
            await queueService.addToQueue(`${transaction.lpsId}FinancialResponses`, response);
        }
        if (transaction.isRefund()) {
            logger.error('Mojaloop Error Handler: Failed to process refund transaction ' + transaction.transactionRequestId);
            // TODO: add to some alerting system?
            const legacyReversalRequest = await transaction.$relatedQuery('lpsMessages').where({ type: models_1.LegacyMessageType.reversalRequest }).first().throwIfNotFound();
            const response = {
                lpsReversalRequestMessageId: legacyReversalRequest.id,
                response: adaptor_relay_messages_1.ResponseType.invalid
            };
            await queueService.addToQueue(`${transaction.lpsId}ReversalResponses`, response);
        }
    }
    catch (error) {
        logger.error('Mojaloop Error Handler: Failed to process error message.' + error.toString());
    }
}
exports.errorResponseHandler = errorResponseHandler;
//# sourceMappingURL=error-response-handler.js.map