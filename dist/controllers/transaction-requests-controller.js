"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function update(request, h) {
    try {
        request.server.app.logger.info('Transaction Requests Controller: Received transaction request response. TransactionRequestId: ' + request.params.ID + ' payload: ' + JSON.stringify(request.payload));
        const message = {
            transactionRequestResponse: request.payload,
            transactionRequestId: request.params.ID,
            headers: request.headers
        };
        await request.server.app.queueService.addToQueue('TransactionRequestResponses', message);
        return h.response().code(200);
    }
    catch (error) {
        return h.response().code(500);
    }
}
exports.update = update;
//# sourceMappingURL=transaction-requests-controller.js.map