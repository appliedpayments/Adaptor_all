"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const queueMessages_1 = require("../types/queueMessages");
async function create(request, h) {
    try {
        request.server.app.logger.info('Authorization Errors Controller: Received autorization error. transactionRequestId: ' + request.params.ID + ' payload: ' + JSON.stringify(request.payload));
        const message = {
            type: queueMessages_1.MojaloopError.authorization,
            typeId: request.params.ID,
            errorInformation: request.payload.errorInformation
        };
        await request.server.app.queueService.addToQueue('ErrorResponses', message);
        return h.response().code(200);
    }
    catch (error) {
        request.server.app.logger.error(`Authorization Errors Controller: Error handling authorization error. ${error.message}`);
        return h.response({
            errorInformation: {
                errorCode: '2001',
                errorDescription: 'An internal error occurred.'
            }
        }).code(500);
    }
}
exports.create = create;
//# sourceMappingURL=authorization-errors-controller.js.map