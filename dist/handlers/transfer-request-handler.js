"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const util_1 = require("../utils/util");
const adaptor_relay_messages_1 = require("../types/adaptor-relay-messages");
const IlpPacket = require('ilp-packet');
const validate = async (transaction) => {
    if (!transaction.isValid()) {
        return util_1.buildMojaloopErrorResponse('5105', 'Transaction is no longer valid.');
    }
    const quote = transaction.quote || await transaction.$relatedQuery('quote').first();
    if (!quote) {
        return util_1.buildMojaloopErrorResponse('3205', 'Quote not found.');
    }
    if (quote.isExpired()) {
        return util_1.buildMojaloopErrorResponse('3302', 'Quote has expired.');
    }
    return undefined;
};
async function transferRequestHandler({ ilpService, mojaClient, logger, queueService }, transferRequest, headers) {
    try {
        const binaryPacket = Buffer.from(transferRequest.ilpPacket, 'base64');
        const jsonPacket = IlpPacket.deserializeIlpPacket(binaryPacket);
        const dataElement = JSON.parse(Buffer.from(jsonPacket.data.data.toString(), 'base64').toString('utf8'));
        const transaction = await models_1.Transaction.query().where('transactionId', dataElement.transactionId).withGraphFetched('quote').first().throwIfNotFound();
        const error = await validate(transaction);
        if (error) {
            await mojaClient.putTransfersError(transferRequest.transferId, error, headers['fspiop-source']);
            const financialRequest = await transaction.$relatedQuery('lpsMessages').where({ type: models_1.LegacyMessageType.financialRequest }).first().throwIfNotFound();
            await queueService.addToQueue(`${transaction.lpsId}FinancialResponses`, { lpsFinancialRequestMessageId: financialRequest.id, response: adaptor_relay_messages_1.ResponseType.invalid });
            return;
        }
        const transfer = await transaction.$relatedQuery('transfer').insert({
            id: transferRequest.transferId,
            quoteId: dataElement.quoteId,
            transactionRequestId: transaction.transactionRequestId,
            fulfillment: ilpService.calculateFulfil(transferRequest.ilpPacket),
            state: models_1.TransferState.received,
            amount: transferRequest.amount.amount,
            currency: transferRequest.amount.currency
        });
        const transferResponse = {
            fulfilment: transfer.fulfillment,
            transferState: models_1.TransferState.committed,
            completedTimestamp: (new Date(Date.now())).toISOString()
        };
        await mojaClient.putTransfers(transfer.id, transferResponse, transferRequest.payerFsp);
        await transaction.$query().update({ previousState: transaction.state, state: models_1.TransactionState.fulfillmentSent });
        await transfer.$query().update({ state: models_1.TransferState.reserved });
    }
    catch (error) {
        logger.error(`Transfer Request Handler: Failed to process transfer request ${transferRequest.transferId} from ${headers['fspiop-source']}. ${error.message}`);
        const errorInfo = {
            errorCode: '2001',
            errorDescription: 'Failed to process transfer request.'
        };
        await mojaClient.putTransfersError(transferRequest.transferId, errorInfo, headers['fspiop-source']);
    }
}
exports.transferRequestHandler = transferRequestHandler;
//# sourceMappingURL=transfer-request-handler.js.map