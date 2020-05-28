"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function create(request, h) {
    try {
        request.server.app.logger.info('Transfers Controller: Received transfer request. payload: ' + JSON.stringify(request.payload));
        const transferRequest = {
            transferRequest: request.payload,
            headers: request.headers
        };
        await request.server.app.queueService.addToQueue('TransferRequests', transferRequest);
        return h.response().code(202);
    }
    catch (error) {
        request.server.app.logger.error(`Transfers Controller: Error handling transfer request. ${error.message}`);
        return h.response().code(500);
    }
}
exports.create = create;
async function update(request, h) {
    try {
        request.server.app.logger.info('Transfers Controller: Received put transfer response. transferId: ' + request.params.ID + ' payload: ' + JSON.stringify(request.payload));
        const transferResponse = {
            transferId: request.params.ID,
            transferResponse: request.payload,
            headers: request.headers
        };
        await request.server.app.queueService.addToQueue('TransferResponses', transferResponse);
        return h.response().code(200);
    }
    catch (error) {
        request.server.app.logger.error(`Transfers Controller: Error handling transfers put response. ${error.message}`);
        return h.response().code(500);
    }
}
exports.update = update;
//# sourceMappingURL=transfers-controller.js.map