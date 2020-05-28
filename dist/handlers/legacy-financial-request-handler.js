"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
async function legacyFinancialRequestHandler({ authorizationsService, logger }, financialRequest) {
    try {
        const transaction = await models_1.Transaction.query().where('lpsKey', financialRequest.lpsKey).withGraphFetched('payer').where('state', models_1.TransactionState.authSent).orderBy('created_at', 'desc').first().throwIfNotFound();
        await transaction.$relatedQuery('lpsMessages').relate(financialRequest.lpsFinancialRequestMessageId);
        if (!financialRequest.authenticationInfo) {
            throw new Error('Missing authenticationInfo.');
        }
        if (!transaction.payer) {
            throw new Error('Transaction does not have payer');
        }
        // TODO: add authorizations to mojaloop sdk
        const headers = {
            'fspiop-destination': transaction.payer.fspId,
            'fspiop-source': process.env.ADAPTOR_FSP_ID || 'adaptor',
            date: new Date().toUTCString(),
            'content-type': 'application/vnd.interoperability.authorizations+json;version=1.0'
        };
        const authorizationsResponse = {
            authenticationInfo: {
                authentication: 'OTP',
                authenticationValue: financialRequest.authenticationInfo.authenticationValue
            },
            responseType: 'ENTERED'
        };
        await authorizationsService.sendAuthorizationsResponse(transaction.transactionRequestId, authorizationsResponse, headers);
        await transaction.$query().update({ state: models_1.TransactionState.financialRequestSent, previousState: transaction.state });
    }
    catch (error) {
        logger.error(`Legacy Financial Request Handler: Failed to process legacy financial request. ${error.message}`);
        // TODO: send cancellation back to LPS switch
    }
}
exports.legacyFinancialRequestHandler = legacyFinancialRequestHandler;
//# sourceMappingURL=legacy-financial-request-handler.js.map