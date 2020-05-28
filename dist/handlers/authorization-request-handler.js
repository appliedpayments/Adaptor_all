"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adaptor_relay_messages_1 = require("../types/adaptor-relay-messages");
const models_1 = require("../models");
const util_1 = require("../utils/util");
const validate = async (transaction) => {
    if (!transaction.isValid()) {
        return { errorCode: '3300', errorDescription: 'Transaction is no longer valid.' };
    }
    if (!transaction.quote) {
        return { errorCode: '3305', errorDescription: 'Quote not found.' };
    }
    if (transaction.quote.isExpired()) {
        return { errorCode: '3302', errorDescription: 'Quote has expired.' };
    }
    return undefined;
};
async function authorizationRequestHandler({ queueService, logger, authorizationsService }, transactionRequestId, headers) {
    try {
        const transaction = await models_1.Transaction.query().where({ transactionRequestId }).withGraphFetched('quote').first().throwIfNotFound();
        const error = await validate(transaction);
        const legacyAuthorizationRequest = await transaction.$relatedQuery('lpsMessages').where({ type: models_1.LegacyMessageType.authorizationRequest }).first().throwIfNotFound();
        if (error) {
            // TODO: add authorizations to mojaloop sdk
            const sendHeaders = {
                'fspiop-destination': headers['fspiop-source'],
                'fspiop-source': process.env.ADAPTOR_FSP_ID || 'adaptor',
                date: new Date().toUTCString(),
                'content-type': 'application/vnd.interoperability.authorizations+json;version=1.0'
            };
            await authorizationsService.sendAuthorizationsErrorResponse(transactionRequestId, error, sendHeaders);
            const authorizationFailure = {
                lpsAuthorizationRequestMessageId: legacyAuthorizationRequest.id,
                response: adaptor_relay_messages_1.ResponseType.invalid
            };
            await queueService.addToQueue(`${transaction.lpsId}AuthorizationResponses`, authorizationFailure);
            return;
        }
        const quote = util_1.assertExists(transaction.quote, 'Transaction does not have a quote');
        const authorizationRequest = {
            lpsAuthorizationRequestMessageId: legacyAuthorizationRequest.id,
            response: adaptor_relay_messages_1.ResponseType.approved,
            fees: {
                amount: quote.feeAmount,
                currency: quote.feeCurrency
            },
            transferAmount: {
                amount: quote.transferAmount,
                currency: quote.transferAmountCurrency
            }
        };
        await queueService.addToQueue(`${transaction.lpsId}AuthorizationResponses`, authorizationRequest);
        await transaction.$query().update({ state: models_1.TransactionState.authSent, previousState: transaction.state });
    }
    catch (error) {
        logger.error(`Authorization Request Handler: Failed to handle authorization request. ${error.message}`);
        const errorInformation = {
            errorCode: '2001',
            errorDescription: 'Failed to handle authorization request.'
        };
        // TODO: add authorizations to mojaloop sdk
        const sendHeaders = {
            'fspiop-destination': headers['fspiop-source'],
            'fspiop-source': process.env.ADAPTOR_FSP_ID || 'adaptor',
            date: new Date().toUTCString(),
            'content-type': 'application/vnd.interoperability.authorizations+json;version=1.0'
        };
        await authorizationsService.sendAuthorizationsErrorResponse(transactionRequestId, errorInformation, sendHeaders);
    }
}
exports.authorizationRequestHandler = authorizationRequestHandler;
//# sourceMappingURL=authorization-request-handler.js.map