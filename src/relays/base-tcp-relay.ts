import { Server, Socket } from 'net'
import { Worker, Job, ConnectionOptions } from 'bullmq'
import { raw } from 'objection'
import { QueueService } from '../services/queue-service'
import { Logger } from '../adaptor'
import { LegacyAuthorizationRequest, LegacyAuthorizationResponse, LegacyFinancialRequest, LegacyFinancialResponse, LegacyReversalRequest, ResponseType, LegacyReversalResponse } from '../types/adaptor-relay-messages'
import { LpsMessage, LegacyMessageType } from '../models'
import { Money } from '@mojaloop/sdk-standard-components'
import { pad } from '../utils/util'
import { TcpRelay, LegacyMessage } from '../types/tcpRelay'
import { ResponseCodes, TcpRelayServices, TcpRelayConfig } from '../types/tcpRelay'
var request = require("request");
const fetch = require('node-fetch')
const js2xmlparser = require("js2xmlparser");
const MlNumber = require('@mojaloop/ml-number')
const IsoParser = require('iso_8583')
var request = require("request");
let xmlParser = require('xml-js');
var parser = require("xml2js")

export class BaseTcpRelay implements TcpRelay {

  protected _logger: Logger
  protected _queueService: QueueService
  protected _lpsId: string
  protected _transactionExpiryWindow: number
  protected _redisConnection: ConnectionOptions
  protected _server?: Server
  protected _socket: Socket

  protected _encode: (message: { [k: string]: any }) => Buffer
  protected _decode: (message: Buffer) => { [k: string]: any }

  protected _authorizationResponseWorker?: Worker
  protected _financialResponseWorker?: Worker
  protected _reversalResponseWorker?: Worker
  protected _responseCodes: ResponseCodes

  constructor ({ logger, queueService, encode, decode, socket }: TcpRelayServices, { lpsId, transactionExpiryWindow, redisConnection, responseCodes }: TcpRelayConfig) {
    if (!socket) {
      throw new Error(`${lpsId} relay: Cannot be created as there is no socket registered.`)
    }

    this._logger = logger
    this._queueService = queueService
    this._encode = encode
    this._decode = decode
    this._lpsId = lpsId
    this._transactionExpiryWindow = transactionExpiryWindow || 30
    this._redisConnection = redisConnection ?? { host: 'localhost', port: 6379 }
    this._responseCodes = responseCodes ?? { approved: '00', invalidTransaction: 'N0', noAction: '21', doNotHonour: '05', noIssuer: '15' }

    socket.on('data', async (data) => {
      try {
        this._logger.debug(`${this._lpsId} relay: Received buffer message`)
        const mti = data.slice(2, 6).toString()
        var  url = `http://122.165.152.131:8444/payeefsp/callbacks/{123}`  
       // console.log('mti', mti)
       // console.log('mti.length :',mti.length)
        /****************************************************** */
        if(mti == '0200'){
      
        /**********************************************************8 */




        const legacyMessage = this._decode(data) 
        
        var lpsKey = null
        var messageType = null
        
       
        legacyMessage[0] = mti
         lpsKey = this.getLpsKey(legacyMessage)
        if(legacyMessage[0] != '0421'){
        this._logger.debug(this._lpsId + ' relay: Received message from: ' + this._lpsId + ' lpsKey: ' + lpsKey)
        this._logger.debug(this._lpsId + ' relay: Message converted to JSON: ' + JSON.stringify(legacyMessage))
        }
  
         messageType = this.getMessageType(legacyMessage[0])
        const processingcode = legacyMessage[3].toString().substring(0,2)
        /**************************************************************************************************/
            if(legacyMessage[0]=='0200'&& processingcode == '40'){

              console.log('isomessage recieved :', legacyMessage)
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
        }

        this._logger.info("Converting iso0200 to iso20022 xml format:")

        console.log(js2xmlparser.parse("Document", iso20022));
        const response = await fetch(url, {

          headers: {
              Accept: 'text/xml'
          },
          method: "POST",
          body: js2xmlparser.parse("Document", iso20022)
      })

      this._logger.info('Sending to :'+url)

      const iso200221 = {
        "code": "3000",
        "message": "Success"
    }
    
    this._logger.info("Response for 20022:")
    this._logger.info(js2xmlparser.parse("response", iso200221))

      try{
        if(response.status=='200'){
          socket.write(encode({ ...legacyMessage, 0: '0210', 39: '00' }))
          this._logger.info('Sending reponse:')
          legacyMessage[0]= '0210'
          legacyMessage[39]='00'
          console.log(legacyMessage)
        }else{
          legacyMessage[39]='91'
          socket.write(encode({ ...legacyMessage, 0: '0210', 39: '91' }))
          this._logger.info('Sending reponse: ')
          legacyMessage[0]= '0210'
          legacyMessage[39]='91'
          console.log(legacyMessage)
        }
       
      }catch(error){
        this._logger.error(error)
      }

        }
        /*************************************************************************************************/
    
      
        var json_withdrawal_request  = {}
        
        switch(legacyMessage[0]){
          case '0200':
          console.log('isomessage recieved :', legacyMessage)
        var buf = Buffer.from(data);
         json_withdrawal_request = {
            "input_Username": "test_user",
            "input_Password": legacyMessage[103],
            "input_CustomerMSISDN": legacyMessage[102],
            "input_Currency": legacyMessage[49],
            "input_BankShortcode": legacyMessage[2].slice(0,6),
            "input_Amount": legacyMessage[4],
            "input_ThirdPartyReference": "71c6d1f93910052de053",
            "input_BankTransactionRef": "12345678123412341234123456789abc"
        }
       
        console.log('Request to m-pesa : ', json_withdrawal_request)
        console.log('Sending to m-pesa : ', url)

        fetch(url, {
                headers: {
                    'Accept': 'application/json',
                },
                method: "POST",
                body: JSON.stringify(json_withdrawal_request)
            })
            .then((response:any) => response.text())
            .then((text:any) => {
                try {
                    const data = JSON.parse(text);

                    console.log('Response recieved from m-pesa:', data)
                    if (data['output_ResponseCode'] == '0') {

                        console.log("Transaction result:", data['output_ResponseDesc'])
                        socket.write(encode({ ...legacyMessage, 0: '0210', 39: '00' }))
                        
                        legacyMessage[0]= '0210'
                        legacyMessage[39]= '00'

                        console.log('Resposne:', legacyMessage)
                    } else if (data['output_ResponseCode'] == '-1') {

                        console.log("Transaction result:", data['output_ResponseDesc'])
                       socket.write(encode({ ...legacyMessage, 0: '0210', 39: '12' }))

                       legacyMessage[0]= '0210'
                       legacyMessage[39]= '12'

                        console.log('Resposne:', legacyMessage)
                    } else if (data['output_ResponseCode'] == '-3') {

                        console.log("Transaction result:", data['output_ResponseDesc'])
                        socket.write(encode({ ...legacyMessage, 0: '0210', 39: '54' }))

                        legacyMessage[0]= '0210'
                        legacyMessage[39]= '54'

                        console.log('Resposne:', legacyMessage)
                    }
                } catch (error) {
                    //this._logger.error(error)
                }
            });


          break;
        //   case'xml ':
        //   let result = xmlParser.xml2json(data, { compact: true, spaces: 4 });

        //   console.log("20022xmldata", result);
        //   var objectValue = JSON.parse(result);
        //   let transaction_id = objectValue['Document']['FIToFICstmrCdtTrf']['CdtTrfTxInf']['PmtId']['TxId'];
        //   let accountnumber = objectValue['Document']['FIToFICstmrCdtTrf']['CdtTrfTxInf']['CdtrAcct']['Id']['Other']['Id']['_text'];
        //   let customerMSDISDN = objectValue['Document']['FIToFICstmrCdtTrf']['CdtTrfTxInf']['Cdtr']['CtctDtls']['MobNb']['_text'];
        //   let amount = objectValue['Document']['FIToFICstmrCdtTrf']['CdtTrfTxInf']['IntrBkSttlmAmt']['amount']['_text'];
        //   let currency_code = objectValue['Document']['FIToFICstmrCdtTrf']['CdtTrfTxInf']['IntrBkSttlmAmt']['Ccy']['_text']
        //    json_withdrawal_request = {
        //       "input_AccountNumber": accountnumber,
        //       "input_CustomerMSISDN": customerMSDISDN,
        //       "input_Amount": amount,
        //       "input_Currency": currency_code,
        //       "input_TransactionID": transaction_id
        //   }

        //   console.log('Request : ', json_withdrawal_request)
        //  let result200 = await fetch(url, {
        //           headers: {
        //               'Accept': 'application/json',
        //           },
        //           method: "POST",
        //           body: JSON.stringify(json_withdrawal_request)
        //       }) .then((response: any) => response.text())
        
        //       .then((text: any) => {
        //           try {
        //             const data = JSON.parse(text);
        //               console.log('data',data)
        //               if (data['output_ResponseCode'] == '0') {
    
        //                   console.log("Transaction result:", data['output_ResponseDesc'])
        //                   const iso20022 = {
        //                       "code": "3000",
        //                       "message": "Success"
        //                   }
        //                   socket.write(Buffer.from(js2xmlparser.parse("response", iso20022)))
                      
        //               } else if (data['output_ResponseCode'] == '-1') {
    
        //                   console.log("Transaction result:", data['output_ResponseDesc'])
        //                   const iso20022 = {
        //                       "code": "xxxx",
        //                       "message": "Failure"
        //                   }
        //                   socket.write(Buffer.from(js2xmlparser.parse("response", iso20022)))
        //               } else if (data['output_ResponseCode'] == '-3') {
    
        //                   console.log("Transaction result:", data['output_ResponseDesc'])
        //                   const iso20022 = {
        //                       "code": "4000",
        //                       "message": "Duplicate"
        //                   }
        //                   socket.write(Buffer.from(js2xmlparser.parse("response", iso20022)))
        //               }
        //           } catch (error) {
        //               //this._logger.error(error)
        //           }
        //         })
        //   break ;
          
          case '0421':
          break;
        }
        if(mti == '0200'){
        const lpsMessage = await LpsMessage.query().insertAndFetch({ lpsId: this._lpsId, lpsKey, type: messageType, content: legacyMessage })
        switch (messageType) {
          case LegacyMessageType.authorizationRequest:
            this._queueService.addToQueue('LegacyAuthorizationRequests', await this.mapFromAuthorizationRequest(lpsMessage.id, legacyMessage))
            break
          case LegacyMessageType.financialRequest:
           // this._queueService.addToQueue('LegacyFinancialRequests', await this.mapFromFinancialRequest(lpsMessage.id, legacyMessage))
            break
          case LegacyMessageType.reversalRequest:
            try {
              this._queueService.addToQueue('LegacyReversalRequests', await this.mapFromReversalAdvice(lpsMessage.id, legacyMessage))
            } catch (error) {
              this._logger.error(this._lpsId + ' relay: Could not process the reversal request from: ' + this._lpsId + ' lpsKey: ' + lpsKey)
              socket.write(encode({ ...legacyMessage, 0: '0430', 39: '21' }))
            }
            break
            case null:
            break
          default:
            this._logger.error(`${this._lpsId} relay: Cannot handle legacy message with mti: ${legacyMessage[0]}`)
        }}}else if(mti == 'mpes'){
          //******************************************************************************* */
          console.log('Data Received :', data.toString())
          const jsondata = JSON.parse(data.toString())
    
          console.log('M-PesaJSON :',jsondata)
    
          const transaction_request = {
            transactionId: '7c23e80c-d078-4077-8263-2c047876fcf6',
            payee: {
              partyIdInfo: {
                partyIdType: 'IBAN',
                partyIdentifier:jsondata['input_BankShortcode'] ,
                fspId: 'payerfsp'
              }
            },
            payer: {
              personalInfo: {
                complexName: {
                  firstName: jsondata['TestIsoMessage.java'],
                  lastName: 'Hagman'
                }
              },
              partyIdInfo: {
                partyIdType: 'MSISDN',
                partyIdentifier: jsondata['input_CustomerMSISDN'],
                fspId: 'M-Pesa'
              }
            },
            amountType: 'RECEIVE',
            surcharge: '',
            amount: {
              amount: jsondata['input_Amount'],
              currency: jsondata['input_Currency']
            },
            transactionType: {
              scenario: 'TRANSFER',
              initiator: 'PAYER',
              initiatorType: 'CONSUMER'
            },
            note: 'From Mats',
            expiration: new Date(new Date().getTime() + 10000)
          }
          var  url1 = `http://122.165.152.131:8444/payeefsp/callbacks/{123}`
          console.log('Converting to Open-api Request : ',)
          console.log()
          console.log( transaction_request)
          console.log('Sending to ',url1)
         let resultmpesa = await fetch(url1, {
                  headers: {
                      'Accept': 'application/json',
                  },
                  method: "POST",
                  body: JSON.stringify(transaction_request)
              }) .then((response: any) => response.text())
        
              .then((text: any) => {
                  try {
                    const data = JSON.parse(text);
                      console.log('Response received : 200')
                      socket.write(Buffer.from('200 ok'))
                      }
                   catch (error) {
                      //this._logger.error(error)
                  }
                })

          //****************************************************************************** */
      //     console.log("Inside xml 1234")
      //   let result = xmlParser.xml2json(data, { compact: true, spaces: 4 });


      //   console.log("20022xmldata", result);
      //   var objectValue = JSON.parse(result);
      //   let transaction_id = objectValue['Document']['FIToFICstmrCdtTrf']['CdtTrfTxInf']['PmtId']['TxId'];
      //   let accountnumber = objectValue['Document']['FIToFICstmrCdtTrf']['CdtTrfTxInf']['CdtrAcct']['Id']['Other']['Id']['_text'];
      //   let customerMSDISDN = objectValue['Document']['FIToFICstmrCdtTrf']['CdtTrfTxInf']['Cdtr']['CtctDtls']['MobNb']['_text'];
      //   let amount = objectValue['Document']['FIToFICstmrCdtTrf']['CdtTrfTxInf']['IntrBkSttlmAmt']['amount']['_text'];
      //   let currency_code = objectValue['Document']['FIToFICstmrCdtTrf']['CdtTrfTxInf']['IntrBkSttlmAmt']['Ccy']['_text']
      //    json_withdrawal_request = {
      //       "input_AccountNumber": accountnumber,
      //       "input_CustomerMSISDN": customerMSDISDN,
      //       "input_Amount": amount,
      //       "input_Currency": currency_code,
      //       "input_TransactionID": transaction_id
      //   }

      //   console.log('Request : ', json_withdrawal_request)
      //  let result200 = await fetch(url, {
      //           headers: {
      //               'Accept': 'application/json',
      //           },
      //           method: "POST",
      //           body: JSON.stringify(json_withdrawal_request)
      //       }) .then((response: any) => response.text())
      
      //       .then((text: any) => {
      //           try {
      //             const data = JSON.parse(text);
      //               console.log('data',data)
      //               if (data['output_ResponseCode'] == '0') {
  
      //                   console.log("Transaction result:", data['output_ResponseDesc'])
      //                   const iso20022 = {
      //                       "code": "3000",
      //                       "message": "Success"
      //                   }
      //                   socket.write(Buffer.from(js2xmlparser.parse("response", iso20022)))
                    
      //               } else if (data['output_ResponseCode'] == '-1') {
  
      //                   console.log("Transaction result:", data['output_ResponseDesc'])
      //                   const iso20022 = {
      //                       "code": "xxxx",
      //                       "message": "Failure"
      //                   }
      //                   socket.write(Buffer.from(js2xmlparser.parse("response", iso20022)))
      //               } else if (data['output_ResponseCode'] == '-3') {
  
      //                   console.log("Transaction result:", data['output_ResponseDesc'])
      //                   const iso20022 = {
      //                       "code": "4000",
      //                       "message": "Duplicate"
      //                   }
      //                   socket.write(Buffer.from(js2xmlparser.parse("response", iso20022)))
      //               }
      //           } catch (error) {
      //               //this._logger.error(error)
      //           }
      //         })
      //       }
              }}catch (error) {
        this._logger.error(`${this._lpsId} relay: Failed to handle iso message.`)
        this._logger.error(error.message)
      }
    })

    socket.on('error', error => {
      this._logger.error(`${this._lpsId} relay: Error: ` + error.message)
    })
    this._socket = socket
  }

  async start (): Promise<void> {
    this._authorizationResponseWorker = new Worker(`${this._lpsId}AuthorizationResponses`, async (job: Job<LegacyAuthorizationResponse>) => {
      try {
        await this.handleAuthorizationResponse(job.data)
      } catch (error) {
        this._logger.error(`${this._lpsId} AuthorizationResponse worker: Failed to handle message. ${error.message}`)
      }
    }, { connection: this._redisConnection })

    this._financialResponseWorker = new Worker(`${this._lpsId}FinancialResponses`, async (job: Job<LegacyFinancialResponse>) => {
      try {
        await this.handleFinancialResponse(job.data)
      } catch (error) {
        this._logger.error(`${this._lpsId} FinancialResponse worker: Failed to handle message. ${error.message}`)
      }
    }, { connection: this._redisConnection })

    this._reversalResponseWorker = new Worker(`${this._lpsId}ReversalResponses`, async (job: Job<LegacyReversalResponse>) => {
      try {
        await this.handleReversalResponse(job.data)
      } catch (error) {
        this._logger.error(`${this._lpsId} ReversalResponse worker: Failed to handle message. ${error.message}`)
      }
    }, { connection: this._redisConnection })
  }

  async shutdown (): Promise<void> {
    this._logger.info(this._lpsId + ' relay: shutting down...')
    if (this._server) {
      this._server.close()
    }
    this._logger.debug(this._lpsId + ' relay: shutting down authorizationResponseWorker...')
    if (this._authorizationResponseWorker) {
      await this._authorizationResponseWorker.close()
    }
    this._logger.debug(this._lpsId + ' relay: shutting down financialResponseWorker...')
    if (this._financialResponseWorker) {
      await this._financialResponseWorker.close()
    }
  }

  getLpsKey(legacyMessage: LegacyMessage): string {
    return ''
  }

  async handleAuthorizationResponse (authorizationResponse: LegacyAuthorizationResponse): Promise<void> {
    const message = await this.mapToAuthorizationResponse(authorizationResponse)

    this._socket.write(this._encode(message))
  }

  async handleFinancialResponse (financialResponse: LegacyFinancialResponse): Promise<void> {
    const message = await this.mapToFinancialResponse(financialResponse)

    this._socket.write(this._encode(message))
  }

  async handleReversalResponse (reversalResponse: LegacyReversalResponse): Promise<void> {
    const message = await this.mapToReversalAdviceResponse(reversalResponse)

    this._socket.write(this._encode(message))
  }

  getMessageType (mti: string): LegacyMessageType {
    switch (mti) {
      case '0100':
        return LegacyMessageType.authorizationRequest
       case '0200':
        return LegacyMessageType.financialRequest
      // case '0420':
      //   return LegacyMessageType.reversalRequest
      //   case 'xml ':
      //   return LegacyMessageType.financialRequest
      //   case '0421':
      //   return LegacyMessageType.financialRequest
      default:
        throw new Error(this._lpsId + 'relay: Cannot handle legacy message with mti: ' + mti)
    }
  }

  calculateFee (legacyMessage: LegacyMessage): Money {
    const amount = legacyMessage[28] ? new MlNumber(legacyMessage[28].slice(1)).divide(100).toString() : '0'
    return { amount, currency: this.getMojaloopCurrency(legacyMessage[49]) }
  }

  getMojaloopCurrency (legacyCurrency: string): string {
    return 'USD' // TODO: currency conversion from legacyMessage[49]
  }

  getTransactionType (legacyMessage: LegacyMessage): { initiatorType: 'DEVICE' | 'AGENT'; scenario: 'WITHDRAWAL' | 'REFUND' } {
    switch (legacyMessage[123].slice(-2)) {
      case '01': {
        return {
          initiatorType: 'AGENT',
          scenario: 'WITHDRAWAL'
        }
      }
      case '02': {
        return {
          initiatorType: 'DEVICE',
          scenario: 'WITHDRAWAL'
        }
      }
      default: {
        throw new Error('Legacy authorization request processing code not valid')
      }
    }
  }

  getResponseCode (response: ResponseType): string {
    switch (response) {
      case ResponseType.approved:
        return this._responseCodes.approved
      case ResponseType.invalid:
        return this._responseCodes.invalidTransaction
      case ResponseType.noPayerFound:
        return this._responseCodes.noIssuer
      case ResponseType.payerFSPRejected:
        return this._responseCodes.doNotHonour
      default:
        throw new Error(`${this._lpsId} relay: Cannot map to a response code.`)
    }
  }

  async mapFromAuthorizationRequest (lpsMessageId: string, legacyMessage: LegacyMessage): Promise<LegacyAuthorizationRequest> {
    throw new Error('map from authorization request is a no op for the base tcp relay class')
  }

  async mapToAuthorizationResponse (authorizationResponse: LegacyAuthorizationResponse): Promise<LegacyMessage> {
    throw new Error('map to authorization response is a no op for the base tcp relay class')
  }

  async mapFromFinancialRequest (lpsMessageId: string, legacyMessage: LegacyMessage): Promise<LegacyFinancialRequest> {
    throw new Error('map from financial request is a no op for the base tcp relay class')
  }

  async mapToFinancialResponse (financialResponse: LegacyFinancialResponse): Promise<LegacyMessage> {
    throw new Error('map to financial response is a no op for the base tcp relay class')
  }

  async mapFromReversalAdvice (lpsMessageId: string, legacyMessage: LegacyMessage): Promise<LegacyReversalRequest> {
    throw new Error('map from reversal request is a no op for the base tcp relay class')
  }

  async mapToReversalAdviceResponse (reversalResponse: LegacyReversalResponse): Promise<LegacyMessage> {
    throw new Error('map to reversal response is a no op for the base tcp relay class')
  }
}
