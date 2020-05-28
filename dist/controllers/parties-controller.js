"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function update(request, h) {
    try {
        request.server.app.logger.info('Received PUT parties. headers: ' + JSON.stringify(request.headers) + ' payload: ' + JSON.stringify(request.payload));
        const message = {
            partiesResponse: request.payload,
            partyIdValue: request.params.ID
        };
        await request.server.app.queueService.addToQueue('PartiesResponse', message);
        return h.response().code(202);
    }
    catch (error) {
        request.server.app.logger.error(`Parties Controller: Error receiving parties PUT request. ${error.message}`);
        return h.response().code(500);
    }
}
exports.update = update;
//# sourceMappingURL=parties-controller.js.map