"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adaptor_relay_messages_1 = require("../types/adaptor-relay-messages");
const models_1 = require("../models");
const uuid = require('uuid/v4');
async function legacyAuthorizationRequestHandler({ logger, mojaClient, queueService }, legacyAuthorizationRequest) {
    try {
        await models_1.Transaction.query().modify('incomplete', legacyAuthorizationRequest.lpsKey).modify('updateState', models_1.TransactionState.transactionCancelled);
        const fees = legacyAuthorizationRequest.lpsFee ? [{ type: 'lps', amount: legacyAuthorizationRequest.lpsFee.amount, currency: legacyAuthorizationRequest.lpsFee.currency }] : [];
        const transaction = await models_1.Transaction.query().insertGraph({
            transactionRequestId: uuid(),
            lpsId: legacyAuthorizationRequest.lpsId,
            lpsKey: legacyAuthorizationRequest.lpsKey,
            amount: legacyAuthorizationRequest.amount.amount,
            currency: legacyAuthorizationRequest.amount.currency,
            expiration: legacyAuthorizationRequest.expiration,
            initiator: 'PAYEE',
            initiatorType: legacyAuthorizationRequest.transactionType.initiatorType,
            scenario: legacyAuthorizationRequest.transactionType.scenario,
            state: models_1.TransactionState.transactionReceived,
            authenticationType: 'OTP',
            fees,
            payer: {
                type: 'payer',
                identifierType: legacyAuthorizationRequest.payer.partyIdType,
                identifierValue: legacyAuthorizationRequest.payer.partyIdentifier
            },
            payee: {
                type: 'payee',
                identifierType: legacyAuthorizationRequest.payee.partyIdType,
                identifierValue: legacyAuthorizationRequest.payee.partyIdentifier,
                subIdOrType: legacyAuthorizationRequest.payee.partySubIdOrType,
                fspId: process.env.ADAPTOR_FSP_ID || 'adaptor'
            }
        });
        await transaction.$relatedQuery('lpsMessages').relate(legacyAuthorizationRequest.lpsAuthorizationRequestMessageId);
        await mojaClient.getParties(legacyAuthorizationRequest.payer.partyIdType, legacyAuthorizationRequest.payer.partyIdentifier, null);
    }
    catch (error) {
        logger.error(`Legacy Authorization Request Handler: Failed to process authorization request. ${error.message}`);
        await queueService.addToQueue(`${legacyAuthorizationRequest.lpsId}AuthorizationResponses`, { lpsAuthorizationRequestMessageId: legacyAuthorizationRequest.lpsAuthorizationRequestMessageId, response: adaptor_relay_messages_1.ResponseType.invalid });
    }
}
exports.legacyAuthorizationRequestHandler = legacyAuthorizationRequestHandler;
//# sourceMappingURL=legacy-authorization-handler.js.map