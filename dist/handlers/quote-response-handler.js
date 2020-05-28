"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const uuid = require('uuid/v4');
async function quoteResponseHandler({ mojaClient, ilpService, logger }, quoteResponse, quoteId, headers) {
    try {
        const quote = await models_1.Quote.query().updateAndFetchById(quoteId, {
            transferAmount: quoteResponse.transferAmount.amount,
            condition: quoteResponse.condition,
            ilpPacket: quoteResponse.ilpPacket,
            expiration: quoteResponse.expiration
        }).first().throwIfNotFound();
        const transferId = uuid();
        const fulfillment = await ilpService.calculateFulfil(quoteResponse.ilpPacket);
        await models_1.Transfers.query().insertGraphAndFetch({
            id: transferId,
            transactionRequestId: quote.transactionRequestId,
            quoteId: quoteId,
            fulfillment: fulfillment,
            state: models_1.TransferState.reserved,
            amount: quoteResponse.transferAmount.amount,
            currency: quoteResponse.transferAmount.currency
        });
        const transfersPostRequest = {
            transferId: transferId,
            payeeFsp: headers['fspiop-source'],
            payerFsp: headers['fspiop-destination'],
            amount: quoteResponse.transferAmount,
            ilpPacket: quoteResponse.ilpPacket,
            condition: quoteResponse.condition,
            expiration: quoteResponse.expiration
        };
        await mojaClient.postTransfers(transfersPostRequest, headers['fspiop-source']);
    }
    catch (error) {
        logger.error(`Quote Response Handler: Could not process party response. ${error.message}`);
    }
}
exports.quoteResponseHandler = quoteResponseHandler;
//# sourceMappingURL=quote-response-handler.js.map