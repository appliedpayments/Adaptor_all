"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function show(request, h) {
    try {
        request.server.app.logger.info('iso8583 Authorization Controller: Received authorization request from Mojaloop. query params:' + JSON.stringify(request.query));
        await request.server.app.queueService.addToQueue('AuthorizationRequests', { transactionRequestId: request.params.ID, headers: request.headers });
        return h.response().code(202);
    }
    catch (error) {
        request.server.app.logger.error(`Error adding Authorization Request to queue. ${error.message}`);
        return h.response().code(500);
    }
}
exports.show = show;
//# sourceMappingURL=authorizations-controller.js.map