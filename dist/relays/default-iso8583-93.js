"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const objection_1 = require("objection");
const adaptor_relay_messages_1 = require("../types/adaptor-relay-messages");
const models_1 = require("../models");
const util_1 = require("../utils/util");
const base_tcp_relay_1 = require("./base-tcp-relay");
const MlNumber = require('@mojaloop/ml-number');
class DefaultIso8583_93TcpRelay extends base_tcp_relay_1.BaseTcpRelay {
    constructor({ logger, queueService, encode, decode, socket }, { lpsId, transactionExpiryWindow, redisConnection, responseCodes }) {
        super({ logger, queueService, encode, decode, socket }, { lpsId, transactionExpiryWindow, redisConnection, responseCodes: responseCodes !== null && responseCodes !== void 0 ? responseCodes : { approved: '00', invalidTransaction: 'N0', noAction: '21', doNotHonour: '05', noIssuer: '15' } });
    }
    getLpsKey(legacyMessage) {
        return this._lpsId;
    }
    getMessageType(mti) {
        switch (mti) {
            case '1100':
                return models_1.LegacyMessageType.authorizationRequest;
            case '1200':
                return models_1.LegacyMessageType.financialRequest;
            case '1420':
                return models_1.LegacyMessageType.reversalRequest;
            default:
                throw new Error(this._lpsId + 'relay: Cannot handle legacy message with mti: ' + mti);
        }
    }
    calculateFee(legacyMessage) {
        const amount = legacyMessage[28] ? new MlNumber(legacyMessage[28].slice(1)).divide(100).toString() : '0';
        return { amount, currency: this.getMojaloopCurrency(legacyMessage[49]) };
    }
    getTransactionType(legacyMessage) {
        switch (legacyMessage[123].slice(-2)) {
            case '01': {
                return {
                    initiatorType: 'AGENT',
                    scenario: 'WITHDRAWAL'
                };
            }
            case '02': {
                return {
                    initiatorType: 'DEVICE',
                    scenario: 'WITHDRAWAL'
                };
            }
            default: {
                throw new Error('Legacy authorization request processing code not valid');
            }
        }
    }
    getResponseCode(response) {
        switch (response) {
            case adaptor_relay_messages_1.ResponseType.approved:
                return this._responseCodes.approved;
            case adaptor_relay_messages_1.ResponseType.invalid:
                return this._responseCodes.invalidTransaction;
            case adaptor_relay_messages_1.ResponseType.noPayerFound:
                return this._responseCodes.noIssuer;
            case adaptor_relay_messages_1.ResponseType.payerFSPRejected:
                return this._responseCodes.doNotHonour;
            default:
                throw new Error(`${this._lpsId} relay: Cannot map to a response code.`);
        }
    }
    async mapFromAuthorizationRequest(lpsMessageId, legacyMessage) {
        this._logger.debug(`${this._lpsId} relay: Mapping from authorization request`);
        return {
            lpsId: this._lpsId,
            lpsKey: this.getLpsKey(legacyMessage),
            lpsAuthorizationRequestMessageId: lpsMessageId,
            amount: {
                amount: new MlNumber(legacyMessage[4]).divide(100).toString(),
                currency: this.getMojaloopCurrency(legacyMessage[49])
            },
            payee: {
                partyIdType: 'DEVICE',
                partyIdentifier: legacyMessage[41],
                partySubIdOrType: legacyMessage[42]
            },
            payer: {
                partyIdType: 'MSISDN',
                partyIdentifier: legacyMessage[102]
            },
            transactionType: this.getTransactionType(legacyMessage),
            expiration: new Date(Date.now() + this._transactionExpiryWindow * 1000).toUTCString(),
            lpsFee: this.calculateFee(legacyMessage)
        };
    }
    async mapToAuthorizationResponse(authorizationResponse) {
        this._logger.debug(`${this._lpsId} relay: Mapping to authorization response`);
        const authorizationRequest = await models_1.LpsMessage.query().where({ id: authorizationResponse.lpsAuthorizationRequestMessageId }).first().throwIfNotFound();
        if (authorizationResponse.response === adaptor_relay_messages_1.ResponseType.approved) {
            const approvalMessage = { ...authorizationRequest.content, 0: '0110', 39: this._responseCodes.approved };
            if (authorizationResponse.fees)
                approvalMessage[30] = 'D' + util_1.pad(new MlNumber(authorizationResponse.fees.amount).multiply(100).toString(), 8, '0');
            if (authorizationResponse.transferAmount)
                approvalMessage[48] = authorizationResponse.transferAmount.amount;
            return approvalMessage;
        }
        else {
            return {
                ...authorizationRequest.content,
                0: '0110',
                39: this._responseCodes.invalidTransaction
            };
        }
    }
    async mapFromFinancialRequest(lpsMessageId, legacyMessage) {
        this._logger.debug(`${this._lpsId} relay: Mapping from financial request`);
        return {
            lpsId: this._lpsId,
            lpsKey: this.getLpsKey(legacyMessage),
            lpsFinancialRequestMessageId: lpsMessageId,
            responseType: 'ENTERED',
            authenticationInfo: {
                authenticationType: 'OTP',
                authenticationValue: legacyMessage[103]
            }
        };
    }
    async mapToFinancialResponse(financialResponse) {
        this._logger.debug(`${this._lpsId} relay: Mapping to financial request`);
        const financialRequest = await models_1.LpsMessage.query().where({ id: financialResponse.lpsFinancialRequestMessageId }).first().throwIfNotFound();
        return {
            ...financialRequest.content,
            0: '0210',
            39: this.getResponseCode(financialResponse.response)
        };
    }
    async mapFromReversalAdvice(lpsMessageId, legacyMessage) {
        this._logger.debug(`${this._lpsId} relay: Mapping from reversal advice`);
        const originalDataElements = String(legacyMessage[90]);
        const mti = originalDataElements.slice(0, 4);
        const stan = originalDataElements.slice(4, 10);
        const date = originalDataElements.slice(10, 20);
        const acquiringId = originalDataElements.slice(20, 31).replace(/^0+/g, '');
        this._logger.debug(JSON.stringify({ originalDataElements, stan, mti, date, acquiringId }));
        const query = models_1.LpsMessage.query()
            .where(objection_1.raw(`JSON_EXTRACT(content, '$."0"') = "${mti}"`))
            .where(objection_1.raw(`JSON_EXTRACT(content, '$."7"') = "${date}"`))
            .where(objection_1.raw(`JSON_EXTRACT(content, '$."11"') = "${stan}"`));
        if (acquiringId !== '')
            query.where(objection_1.raw(`JSON_EXTRACT(content, '$."32"') = "${acquiringId}"`));
        const prevLpsMessageId = await query.orderBy('created_at', 'desc').first().throwIfNotFound();
        this._logger.debug(`${this._lpsId} relay: Found previous lps message: id: ${prevLpsMessageId.id} content: ${JSON.stringify(prevLpsMessageId.content)}`);
        return {
            lpsId: this._lpsId,
            lpsKey: this._lpsId + '-' + legacyMessage[41] + '-' + legacyMessage[42],
            lpsFinancialRequestMessageId: prevLpsMessageId.id,
            lpsReversalRequestMessageId: lpsMessageId
        };
    }
    async mapToReversalAdviceResponse(reversalResponse) {
        this._logger.debug(`${this._lpsId} relay: Mapping to reversal response`);
        const reversalRequest = await models_1.LpsMessage.query().where({ id: reversalResponse.lpsReversalRequestMessageId }).first().throwIfNotFound();
        return {
            ...reversalRequest.content,
            0: '0430',
            39: this.getResponseCode(reversalResponse.response)
        };
    }
}
exports.DefaultIso8583_93TcpRelay = DefaultIso8583_93TcpRelay;
//# sourceMappingURL=default-iso8583-93.js.map