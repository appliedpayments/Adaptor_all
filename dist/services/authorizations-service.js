"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class KnexAuthorizationsService {
    constructor(options) {
        this._logger = console;
        this._knex = options.knex;
        this._client = options.client;
        this._logger = options.logger || console;
    }
    async sendAuthorizationsResponse(transactionRequestId, request, headers) {
        this._logger.debug('Authorizations Service: sending Authorizations Response: ' + transactionRequestId);
        await this._client.put(`/authorizations/${transactionRequestId}`, request, { headers });
    }
    async sendAuthorizationsErrorResponse(transactionRequestId, error, headers) {
        this._logger.debug('Authorizations Service: sending Authorizations Error Response: ' + transactionRequestId);
        await this._client.put(`/authorizations/${transactionRequestId}/error`, { errorInformation: error }, { headers });
    }
}
exports.KnexAuthorizationsService = KnexAuthorizationsService;
//# sourceMappingURL=authorizations-service.js.map