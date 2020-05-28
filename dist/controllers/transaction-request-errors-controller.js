"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const queueMessages_1 = require("../types/queueMessages");
async function create(request, h) {
    try {
        request.server.app.logger.info('Transaction Request Errors Controller: Received transaction request error. transactionRequestId: ' + request.params.ID + ' payload: ' + JSON.stringify(request.payload));
        const message = {
            type: queueMessages_1.MojaloopError.transactionRequest,
            typeId: request.params.ID,
            errorInformation: request.payload.errorInformation
        };
        await request.server.app.queueService.addToQueue('ErrorResponses', message);
        return h.response().code(200);
    }
    catch (error) {
        request.server.app.logger.error(`Transaction Request Errors Controller: Error handling transaction request error. ${error.message}`);
        return h.response({
            errorInformation: {
                errorCode: '2001',
                errorDescription: 'An internal error occurred.'
            }
        }).code(500);
    }
}
exports.create = create;
//# sourceMappingURL=transaction-request-errors-controller.js.map