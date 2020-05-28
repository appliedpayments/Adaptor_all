"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
async function partiesResponseHandler({ mojaClient, logger }, partiesResponse, partyIdValue) {
    try {
        const fspId = partiesResponse.party.partyIdInfo.fspId;
        if (!fspId) {
            throw new Error('No fspId.');
        }
        const transaction = await models_1.Transaction.query().where({ state: models_1.TransactionState.transactionReceived }).withGraphFetched('[payer, payee]').modify('payerMsisdn', partyIdValue).orderBy('created_at', 'desc').first().throwIfNotFound();
        if (!transaction.payee || !transaction.payer) {
            throw new Error('Transaction does not have a payee or payer.');
        }
        transaction.payer = await transaction.payer.$query().updateAndFetch({ fspId });
        const transactionRequest = {
            amount: {
                amount: transaction.amount,
                currency: transaction.currency
            },
            payee: {
                partyIdInfo: {
                    partyIdType: transaction.payee.identifierType,
                    partyIdentifier: transaction.payee.identifierValue,
                    partySubIdOrType: transaction.payee.subIdOrType,
                    fspId: transaction.payee.fspId
                }
            },
            payer: {
                partyIdType: transaction.payer.identifierType,
                partyIdentifier: transaction.payer.identifierValue,
                fspId
            },
            transactionRequestId: transaction.transactionRequestId,
            transactionType: {
                initiator: transaction.initiator,
                initiatorType: transaction.initiatorType,
                scenario: transaction.scenario
            }
        };
        await mojaClient.postTransactionRequests(transactionRequest, fspId);
    }
    catch (error) {
        logger.error(`Parties response handler: Could not process party response. ${error.message}`);
    }
}
exports.partiesResponseHandler = partiesResponseHandler;
//# sourceMappingURL=parties-response-handler.js.map