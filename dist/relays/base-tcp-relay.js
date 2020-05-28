"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const adaptor_relay_messages_1 = require("../types/adaptor-relay-messages");
const models_1 = require("../models");
var request = require("request");
const fetch = require('node-fetch');
const js2xmlparser = require("js2xmlparser");
const MlNumber = require('@mojaloop/ml-number');
class BaseTcpRelay {
    constructor({ logger, queueService, encode, decode, socket }, { lpsId, transactionExpiryWindow, redisConnection, responseCodes }) {
        if (!socket) {
            throw new Error(`${lpsId} relay: Cannot be created as there is no socket registered.`);
        }
        this._logger = logger;
        this._queueService = queueService;
        this._encode = encode;
        this._decode = decode;
        this._lpsId = lpsId;
        this._transactionExpiryWindow = transactionExpiryWindow || 30;
        this._redisConnection = redisConnection !== null && redisConnection !== void 0 ? redisConnection : { host: 'localhost', port: 6379 };
        this._responseCodes = responseCodes !== null && responseCodes !== void 0 ? responseCodes : { approved: '00', invalidTransaction: 'N0', noAction: '21', doNotHonour: '05', noIssuer: '15' };
        socket.on('data', async (data) => {
            try {
                this._logger.debug(`${this._lpsId} relay: Received buffer message`);
                const legacyMessage = this._decode(data);
                const lpsKey = this.getLpsKey(legacyMessage);
                this._logger.debug(this._lpsId + ' relay: Received message from: ' + this._lpsId + ' lpsKey: ' + lpsKey);
                this._logger.debug(this._lpsId + ' relay: Message converted to JSON: ' + JSON.stringify(legacyMessage));
                const messageType = this.getMessageType(legacyMessage[0]);
                const processingcode = legacyMessage[3].toString().substring(0, 2);
                if (legacyMessage[0] == '0200' && processingcode == '40') {
                    var iso20022 = {
                        "xmlns": "urn:iso:std:iso:20022:tech:xsd:pacs.008.001.05",
                        "xsi": "http://www.w3.org/2001/XMLSchema-instance",
                        "FIToFICstmrCdtTrf": {
                            "GrpHdr": {
                                "MsgId": "7c23e80c-d078-4077-8263-2c047876fcf6",
                                "CreDtTm": new Date(new Date().getTime() + 10000),
                                "NbOfTxs": "1",
                                "SttlmInf": {
                                    "SttlmMtd": "CLRG"
                                }
                            },
                            "CdtTrfTxInf": {
                                "PmtId": {
                                    "EndToEndId": "KGB57799",
                                    "TxId": "KGB57799"
                                },
                                "PmtTpInf": {
                                    "SvcLvl": {
                                        "Cd": "NURG"
                                    }
                                },
                                "IntrBkSttlmAmt": {
                                    "Ccy": legacyMessage[49],
                                    "amount": legacyMessage[4]
                                },
                                "IntrBkSttlmDt": "2020-01-01",
                                "ChrgBr": "SLEV",
                                "Dbtr": {
                                    "Nm": "Joe Soap",
                                    "PstlAdr": {
                                        "PstlAdr": {
                                            "StrtNm": "120 HIGH ROAD",
                                            "PstCd": "4430",
                                            "TwnNm": "Manzini",
                                            "Ctry": "SZ"
                                        }
                                    }
                                },
                                "DbtrAcct": {
                                    "Id": {
                                        "other": {
                                            "Id": legacyMessage[102]
                                        }
                                    }
                                },
                                "DbtrAgt": {
                                    "FinInstnId": {
                                        "BICFI": legacyMessage[32]
                                    }
                                },
                                "CdtrAgt": {
                                    "FinInstnId": {
                                        "BICFI": legacyMessage[100]
                                    }
                                },
                                "Cdtr": {
                                    "Nm": "SOAP",
                                    "PstlAdr": {
                                        "StrtNm": "78 Strand Str",
                                        "PstCd": "6725",
                                        "TwnNm": "Cape Town",
                                        "Ctry": "ZA"
                                    }
                                },
                                "CdtrAcct": {
                                    "Id": {
                                        "Other": {
                                            "Id": legacyMessage[103]
                                        }
                                    }
                                },
                                "RgltryRptg": {
                                    "Dtls": {
                                        "Cd": "10402"
                                    }
                                },
                                "RmtInf": {
                                    "Ustrd": "52363"
                                }
                            }
                        }
                    };
                    this._logger.info(js2xmlparser.parse("Document", iso20022));
                    const url = 'http://122.165.152.131:8444/payeefsp/callbacks/{123}';
                    const response = await fetch(url, {
                        headers: {
                            Accept: 'text/xml'
                        },
                        method: "POST",
                        body: iso20022
                    });
                    try {
                        if (response.status == '200') {
                            socket.write(encode({ ...legacyMessage, 0: '0210', 39: '00' }));
                            this._logger.info('response 200 ');
                        }
                        else {
                            legacyMessage[39] = '91';
                            socket.write(encode({ ...legacyMessage, 0: '0210', 39: '91' }));
                            this._logger.info('response 404 ');
                        }
                    }
                    catch (error) {
                        this._logger.error(error);
                    }
                }
                const lpsMessage = await models_1.LpsMessage.query().insertAndFetch({ lpsId: this._lpsId, lpsKey, type: messageType, content: legacyMessage });
                switch (messageType) {
                    case models_1.LegacyMessageType.authorizationRequest:
                        this._queueService.addToQueue('LegacyAuthorizationRequests', await this.mapFromAuthorizationRequest(lpsMessage.id, legacyMessage));
                        break;
                    case models_1.LegacyMessageType.financialRequest:
                        this._queueService.addToQueue('LegacyFinancialRequests', await this.mapFromFinancialRequest(lpsMessage.id, legacyMessage));
                        break;
                    case models_1.LegacyMessageType.reversalRequest:
                        try {
                            this._queueService.addToQueue('LegacyReversalRequests', await this.mapFromReversalAdvice(lpsMessage.id, legacyMessage));
                        }
                        catch (error) {
                            this._logger.error(this._lpsId + ' relay: Could not process the reversal request from: ' + this._lpsId + ' lpsKey: ' + lpsKey);
                            socket.write(encode({ ...legacyMessage, 0: '0430', 39: '21' }));
                        }
                        break;
                    default:
                        this._logger.error(`${this._lpsId} relay: Cannot handle legacy message with mti: ${legacyMessage[0]}`);
                }
            }
            catch (error) {
                this._logger.error(`${this._lpsId} relay: Failed to handle iso message.`);
                this._logger.error(error.message);
            }
        });
        socket.on('error', error => {
            this._logger.error(`${this._lpsId} relay: Error: ` + error.message);
        });
        this._socket = socket;
    }
    async start() {
        this._authorizationResponseWorker = new bullmq_1.Worker(`${this._lpsId}AuthorizationResponses`, async (job) => {
            try {
                await this.handleAuthorizationResponse(job.data);
            }
            catch (error) {
                this._logger.error(`${this._lpsId} AuthorizationResponse worker: Failed to handle message. ${error.message}`);
            }
        }, { connection: this._redisConnection });
        this._financialResponseWorker = new bullmq_1.Worker(`${this._lpsId}FinancialResponses`, async (job) => {
            try {
                await this.handleFinancialResponse(job.data);
            }
            catch (error) {
                this._logger.error(`${this._lpsId} FinancialResponse worker: Failed to handle message. ${error.message}`);
            }
        }, { connection: this._redisConnection });
        this._reversalResponseWorker = new bullmq_1.Worker(`${this._lpsId}ReversalResponses`, async (job) => {
            try {
                await this.handleReversalResponse(job.data);
            }
            catch (error) {
                this._logger.error(`${this._lpsId} ReversalResponse worker: Failed to handle message. ${error.message}`);
            }
        }, { connection: this._redisConnection });
    }
    async shutdown() {
        this._logger.info(this._lpsId + ' relay: shutting down...');
        if (this._server) {
            this._server.close();
        }
        this._logger.debug(this._lpsId + ' relay: shutting down authorizationResponseWorker...');
        if (this._authorizationResponseWorker) {
            await this._authorizationResponseWorker.close();
        }
        this._logger.debug(this._lpsId + ' relay: shutting down financialResponseWorker...');
        if (this._financialResponseWorker) {
            await this._financialResponseWorker.close();
        }
    }
    getLpsKey(legacyMessage) {
        return '';
    }
    async handleAuthorizationResponse(authorizationResponse) {
        const message = await this.mapToAuthorizationResponse(authorizationResponse);
        this._socket.write(this._encode(message));
    }
    async handleFinancialResponse(financialResponse) {
        const message = await this.mapToFinancialResponse(financialResponse);
        this._socket.write(this._encode(message));
    }
    async handleReversalResponse(reversalResponse) {
        const message = await this.mapToReversalAdviceResponse(reversalResponse);
        this._socket.write(this._encode(message));
    }
    getMessageType(mti) {
        switch (mti) {
            case '0100':
                return models_1.LegacyMessageType.authorizationRequest;
            case '0200':
                return models_1.LegacyMessageType.financialRequest;
            case '0420':
                return models_1.LegacyMessageType.reversalRequest;
            default:
                throw new Error(this._lpsId + 'relay: Cannot handle legacy message with mti: ' + mti);
        }
    }
    calculateFee(legacyMessage) {
        const amount = legacyMessage[28] ? new MlNumber(legacyMessage[28].slice(1)).divide(100).toString() : '0';
        return { amount, currency: this.getMojaloopCurrency(legacyMessage[49]) };
    }
    getMojaloopCurrency(legacyCurrency) {
        return 'USD'; // TODO: currency conversion from legacyMessage[49]
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
        throw new Error('map from authorization request is a no op for the base tcp relay class');
    }
    async mapToAuthorizationResponse(authorizationResponse) {
        throw new Error('map to authorization response is a no op for the base tcp relay class');
    }
    async mapFromFinancialRequest(lpsMessageId, legacyMessage) {
        throw new Error('map from financial request is a no op for the base tcp relay class');
    }
    async mapToFinancialResponse(financialResponse) {
        throw new Error('map to financial response is a no op for the base tcp relay class');
    }
    async mapFromReversalAdvice(lpsMessageId, legacyMessage) {
        throw new Error('map from reversal request is a no op for the base tcp relay class');
    }
    async mapToReversalAdviceResponse(reversalResponse) {
        throw new Error('map to reversal response is a no op for the base tcp relay class');
    }
}
exports.BaseTcpRelay = BaseTcpRelay;
//# sourceMappingURL=base-tcp-relay.js.map