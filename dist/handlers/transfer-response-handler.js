"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adaptor_relay_messages_1 = require("../types/adaptor-relay-messages");
const models_1 = require("../models");
async function transferResponseHandler({ queueService, logger }, transferResponse, headers, transferId) {
    try {
        const transfer = await models_1.Transfers.query().where({ id: transferId }).first().throwIfNotFound();
        const transaction = await models_1.Transaction.query().where({ transactionRequestId: transfer.transactionRequestId }).first().throwIfNotFound();
        if (!transaction.isRefund() && transferResponse.transferState === models_1.TransferState.committed) {
            const legacyFinancialRequest = await transaction.$relatedQuery('lpsMessages').where({ type: models_1.LegacyMessageType.financialRequest }).first().throwIfNotFound();
            const legacyFinancialResponse = {
                lpsFinancialRequestMessageId: legacyFinancialRequest.id,
                response: adaptor_relay_messages_1.ResponseType.approved
            };
            await queueService.addToQueue(`${transaction.lpsId}FinancialResponses`, legacyFinancialResponse);
            await transaction.$query().update({ state: models_1.TransactionState.financialResponse, previousState: transaction.state });
            await transfer.$query().update({ state: models_1.TransferState.committed });
        }
        if (transaction.isRefund() && transferResponse.transferState === models_1.TransferState.committed) {
            const legacyReversalRequest = await transaction.$relatedQuery('lpsMessages').where({ type: models_1.LegacyMessageType.reversalRequest }).first().throwIfNotFound();
            const legacyReversalResponse = {
                lpsReversalRequestMessageId: legacyReversalRequest.id,
                response: adaptor_relay_messages_1.ResponseType.approved
            };
            await queueService.addToQueue(`${transaction.lpsId}ReversalResponses`, legacyReversalResponse);
            await transaction.$query().update({ state: models_1.TransactionState.financialResponse, previousState: transaction.state });
            await transfer.$query().update({ state: models_1.TransferState.committed });
        }
    }
    catch (error) {
        logger.error(`Transfer Response Handler: Could not process transfer response for transferId=${transferId} from ${headers['fspiop-source']}. ${error.message}`);
        // TODO: what should the adaptor do here? Start refund process?
    }
}
exports.transferResponseHandler = transferResponseHandler;
//# sourceMappingURL=transfer-response-handler.js.map