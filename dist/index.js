"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const knex_1 = tslib_1.__importDefault(require("knex"));
const axios_1 = tslib_1.__importDefault(require("axios"));
const bullmq_1 = require("bullmq");
const net_1 = require("net");
const adaptor_1 = require("./adaptor");
const default_iso8583_87_1 = require("./relays/default-iso8583-87");
const authorizations_service_1 = require("./services/authorizations-service");
const queue_service_1 = require("./services/queue-service");
const sdk_standard_components_1 = require("@mojaloop/sdk-standard-components");
const quote_request_handler_1 = require("./handlers/quote-request-handler");
const transaction_request_response_handler_1 = require("./handlers/transaction-request-response-handler");
const quote_response_handler_1 = require("./handlers/quote-response-handler");
const parties_response_handler_1 = require("./handlers/parties-response-handler");
const authorization_request_handler_1 = require("./handlers/authorization-request-handler");
const transfer_request_handler_1 = require("./handlers/transfer-request-handler");
const transfer_response_handler_1 = require("./handlers/transfer-response-handler");
const objection_1 = require("objection");
const legacy_authorization_handler_1 = require("./handlers/legacy-authorization-handler");
const legacy_financial_request_handler_1 = require("./handlers/legacy-financial-request-handler");
const legacy_reversals_handler_1 = require("./handlers/legacy-reversals-handler");
const IsoParser = require('iso_8583');
const MojaloopSdk = require('@mojaloop/sdk-standard-components');
const Logger = require('@mojaloop/central-services-logger');
Logger.log = Logger.info;
const HTTP_PORT = process.env.HTTP_PORT || 3000;
const TCP_PORT = process.env.TCP_PORT || 3001;
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const ADAPTOR_FSP_ID = process.env.ADAPTOR_FSP_ID || 'adaptor';
const TRANSACTION_REQUESTS_URL = process.env.TRANSACTION_REQUESTS_URL || 'http://transaction-requests.local';
const QUOTE_REQUESTS_URL = process.env.QUOTE_REQUESTS_URL || 'http://quote-requests.local';
const TRANSFERS_URL = process.env.TRANSFERS_URL || 'http://transfers.local';
const AUTHORIZATIONS_URL = process.env.AUTHORIZATIONS_URL || 'http://authorizations.local';
const ACCOUNT_LOOKUP_URL = process.env.ACCOUNT_LOOKUP_URL || 'http://account-lookup-service.local';
const ILP_SECRET = process.env.ILP_SECRET || 'secret';
const KNEX_CLIENT = process.env.KNEX_CLIENT || 'sqlite3';
const knex = KNEX_CLIENT === 'mysql' ? knex_1.default({
    client: 'mysql',
    connection: {
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
    }
}) : knex_1.default({
    client: 'sqlite3',
    connection: {
        filename: ':memory:',
        supportBigNumbers: true
    },
    useNullAsDefault: true
});
objection_1.Model.knex(knex);
const redisConnection = { host: REDIS_HOST, port: Number(REDIS_PORT) };
const queueService = new queue_service_1.BullQueueService([
    'ErrorResponses',
    'QuoteRequests',
    'QuoteResponses',
    'TransactionRequestResponses',
    'PartiesResponse',
    'AuthorizationRequests',
    'TransferRequests',
    'TransferResponses',
    'LegacyAuthorizationRequests',
    'LegacyFinancialRequests',
    'LegacyReversalRequests',
    'lps1AuthorizationResponses',
    'lps1FinancialResponses',
    'lps1ReversalResponses'
], redisConnection);
const AuthorizationsClient = axios_1.default.create({
    baseURL: AUTHORIZATIONS_URL,
    timeout: 3000
});
const authorizationsService = new authorizations_service_1.KnexAuthorizationsService({ knex, client: AuthorizationsClient, logger: Logger });
const mojaClient = new sdk_standard_components_1.MojaloopRequests({
    logger: Logger,
    dfspId: ADAPTOR_FSP_ID,
    quotesEndpoint: QUOTE_REQUESTS_URL,
    alsEndpoint: ACCOUNT_LOOKUP_URL,
    transfersEndpoint: TRANSFERS_URL,
    transactionRequestsEndpoint: TRANSACTION_REQUESTS_URL,
    jwsSign: false,
    tls: { outbound: { mutualTLS: { enabled: false } } },
    wso2Auth: {
        getToken: () => null
    },
    jwsSigningKey: 'string',
    peerEndpoint: 'string'
});
const adaptorServices = {
    authorizationsService,
    mojaClient,
    queueService,
    logger: Logger,
    calculateAdaptorFees: async (transaction) => ({ amount: '0', currency: transaction.currency }),
    ilpService: new MojaloopSdk.Ilp({ secret: ILP_SECRET, logger: Logger })
};
const encode = (message) => {
    return new IsoParser(message).getBufferMessage();
};
const decode = (data) => {
    return new IsoParser().getIsoJSON(data);
};
const start = async () => {
    let shuttingDown = false;
    console.log('LOG_LEVEL:', process.env.LOG_LEVEL);
    console.log('REDIS_HOST:', REDIS_HOST, 'REDIS_PORT:', REDIS_PORT);
    console.log('TRANSACTION_REQUESTS_URL:', TRANSACTION_REQUESTS_URL);
    await knex.migrate.latest();
    const workers = new Map();
    // TODO: Error handling if worker throws an error
    workers.set('quoteRequests', new bullmq_1.Worker('QuoteRequests', async (job) => {
        await quote_request_handler_1.quotesRequestHandler(adaptorServices, job.data.payload, job.data.headers);
    }, { connection: redisConnection }));
    workers.set('quoteResponses', new bullmq_1.Worker('QuoteResponses', async (job) => {
        await quote_response_handler_1.quoteResponseHandler(adaptorServices, job.data.quoteResponse, job.data.quoteId, job.data.headers);
    }, { connection: redisConnection }));
    workers.set('transactionRequests', new bullmq_1.Worker('TransactionRequestResponses', async (job) => {
        await transaction_request_response_handler_1.transactionRequestResponseHandler(adaptorServices, job.data.transactionRequestResponse, job.data.headers, job.data.transactionRequestId);
    }, { connection: redisConnection }));
    workers.set('partiesResponses', new bullmq_1.Worker('PartiesResponse', async (job) => {
        await parties_response_handler_1.partiesResponseHandler(adaptorServices, job.data.partiesResponse, job.data.partyIdValue);
    }, { connection: redisConnection }));
    workers.set('authorizationRequests', new bullmq_1.Worker('AuthorizationRequests', async (job) => {
        await authorization_request_handler_1.authorizationRequestHandler(adaptorServices, job.data.transactionRequestId, job.data.headers);
    }, { connection: redisConnection }));
    workers.set('transferRequests', new bullmq_1.Worker('TransferRequests', async (job) => {
        await transfer_request_handler_1.transferRequestHandler(adaptorServices, job.data.transferRequest, job.data.headers);
    }, { connection: redisConnection }));
    workers.set('transferResponses', new bullmq_1.Worker('TransferResponses', async (job) => {
        await transfer_response_handler_1.transferResponseHandler(adaptorServices, job.data.transferResponse, job.data.headers, job.data.transferId);
    }, { connection: redisConnection }));
    workers.set('legacyAuthorizationRequests', new bullmq_1.Worker('LegacyAuthorizationRequests', async (job) => {
        await legacy_authorization_handler_1.legacyAuthorizationRequestHandler(adaptorServices, job.data);
    }, { connection: redisConnection }));
    workers.set('legacyFinancialRequests', new bullmq_1.Worker('LegacyFinancialRequests', async (job) => {
        await legacy_financial_request_handler_1.legacyFinancialRequestHandler(adaptorServices, job.data);
    }, { connection: redisConnection }));
    workers.set('legacyReversalRequests', new bullmq_1.Worker('LegacyReversalRequests', async (job) => {
        await legacy_reversals_handler_1.legacyReversalHandler(adaptorServices, job.data);
    }, { connection: redisConnection }));
    const adaptor = await adaptor_1.createApp(adaptorServices, { port: HTTP_PORT });
    await adaptor.start();
    adaptor.app.logger.info(`Adaptor HTTP server listening on port:${HTTP_PORT}`);
    const sockets = [];
    const tcpServer = net_1.createServer(async (socket) => {
        Logger.info('Connection received for lps1 relay.');
        sockets.push(socket);
        const relay = new default_iso8583_87_1.DefaultIso8583_87TcpRelay({ decode, encode, logger: Logger, queueService, socket }, { lpsId: 'lps1', redisConnection });
        await relay.start();
        socket.on('close', async () => {
            await relay.shutdown();
        });
    }).listen(TCP_PORT, () => { Logger.info('lps1 relay listening on port: ' + TCP_PORT); });
    process.on('SIGINT', async () => {
        try {
            if (shuttingDown) {
                console.warn('received second SIGINT during graceful shutdown, exiting forcefully.');
                process.exit(1);
            }
            shuttingDown = true;
            // Graceful shutdown
            tcpServer.close();
            sockets.forEach(sock => { sock.destroy(); });
            await adaptor.stop();
            await Promise.all(Array.from(workers.values()).map(worker => worker.close()));
            await queueService.shutdown();
            knex.destroy();
            console.log('completed graceful shutdown.');
        }
        catch (err) {
            const errInfo = err && typeof err === 'object' && err.stack ? err.stack : err;
            console.error('error while shutting down. error=%s', errInfo);
            process.exit(1);
        }
    });
};
start();
//# sourceMappingURL=index.js.map