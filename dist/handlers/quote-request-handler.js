"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const util_1 = require("../utils/util");
const adaptor_relay_messages_1 = require("../types/adaptor-relay-messages");
const MlNumber = require('@mojaloop/ml-number');
const QUOTE_EXPIRATION_WINDOW = process.env.QUOTE_EXPIRATION_WINDOW || 10;
const validate = async (transaction) => {
    if (!transaction.isValid()) {
        return util_1.buildMojaloopErrorResponse('3301', 'Transaction is no longer valid.');
    }
    return undefined;
};
async function quotesRequestHandler({ calculateAdaptorFees, mojaClient, ilpService, logger, queueService }, quoteRequest, headers) {
    var _a;
    try {
        if (!quoteRequest.transactionRequestId) {
            throw new Error('No transactionRequestId given for quoteRequest.');
        }
        const transaction = await models_1.Transaction.query().where('transactionRequestId', quoteRequest.transactionRequestId).withGraphFetched('fees').first().throwIfNotFound();
        const error = await validate(transaction);
        if (error) {
            await mojaClient.putQuotesError(quoteRequest.quoteId, error, headers['fspiop-source']);
            const legacyAuthorizationRequest = await transaction.$relatedQuery('lpsMessages').where({ type: models_1.LegacyMessageType.authorizationRequest }).first().throwIfNotFound();
            await queueService.addToQueue(`${transaction.lpsId}AuthorizationResponses`, { lpsAuthorizationRequestMessageId: legacyAuthorizationRequest.id, response: adaptor_relay_messages_1.ResponseType.invalid });
            return;
        }
        const adaptorFees = await calculateAdaptorFees(transaction);
        await transaction.$relatedQuery('fees').insert({ type: 'adaptor', ...adaptorFees });
        // TODO: consider different currencies?
        const otherFees = (_a = transaction.fees) === null || _a === void 0 ? void 0 : _a.map(fee => fee.amount).reduce((total, current) => new MlNumber(total).add(current).toString(), '0');
        const totalFeeAmount = otherFees ? new MlNumber(otherFees).add(adaptorFees.amount).toString() : adaptorFees.amount;
        const transferAmount = new MlNumber(totalFeeAmount).add(quoteRequest.amount.amount).toString();
        const expiration = new Date(Date.now() + Number(QUOTE_EXPIRATION_WINDOW) * 1000).toUTCString();
        const { ilpPacket, condition } = await ilpService.getQuoteResponseIlp(quoteRequest, { transferAmount: { amount: transferAmount, currency: transaction.currency } });
        await transaction.$relatedQuery('quote').insertAndFetch({
            id: quoteRequest.quoteId,
            amount: quoteRequest.amount.amount,
            amountCurrency: quoteRequest.amount.currency,
            transactionId: quoteRequest.transactionId,
            feeAmount: totalFeeAmount,
            feeCurrency: transaction.currency,
            transferAmount,
            transferAmountCurrency: transaction.currency,
            expiration,
            condition,
            ilpPacket
        });
        const quoteResponse = {
            condition,
            ilpPacket,
            expiration: expiration,
            transferAmount: {
                amount: transferAmount,
                currency: transaction.currency
            }
        };
        await mojaClient.putQuotes(quoteRequest.quoteId, quoteResponse, headers['fspiop-source']);
        await transaction.$query().update({ state: models_1.TransactionState.quoteResponded, previousState: transaction.state });
    }
    catch (error) {
        logger.error(`Quote Request Handler: Failed to process quote request: ${quoteRequest.quoteId} from ${headers['fspiop-source']}. ${error.message}`);
        mojaClient.putQuotesError(quoteRequest.quoteId, util_1.buildMojaloopErrorResponse('2001', 'Failed to process quote request'), headers['fspiop-source']);
    }
}
exports.quotesRequestHandler = quotesRequestHandler;
//# sourceMappingURL=quote-request-handler.js.map