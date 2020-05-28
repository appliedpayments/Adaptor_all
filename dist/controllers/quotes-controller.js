"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function create(request, h) {
    try {
        request.server.app.logger.info('Received POST quote request. headers: ' + JSON.stringify(request.headers) + ' payload: ' + JSON.stringify(request.payload));
        const quotesObject = {
            payload: request.payload,
            headers: request.headers
        };
        await request.server.app.queueService.addToQueue('QuoteRequests', quotesObject);
        return h.response().code(202);
    }
    catch (error) {
        return h.response().code(500);
    }
}
exports.create = create;
async function update(request, h) {
    try {
        request.server.app.logger.info('Received PUT quote response. headers: ' + JSON.stringify(request.headers) + ' payload: ' + JSON.stringify(request.payload));
        const message = {
            quoteResponse: request.payload,
            quoteId: request.params.ID,
            headers: request.headers
        };
        await request.server.app.queueService.addToQueue('QuoteResponses', message);
        return h.response().code(200);
    }
    catch (error) {
        return h.response().code(500);
    }
}
exports.update = update;
//# sourceMappingURL=quotes-controller.js.map