"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const hapi_1 = require("hapi");
const TransactionRequestsController = tslib_1.__importStar(require("./controllers/transaction-requests-controller"));
const QuotesController = tslib_1.__importStar(require("./controllers/quotes-controller"));
const PartiesController = tslib_1.__importStar(require("./controllers/parties-controller"));
const swagger_json_1 = tslib_1.__importDefault(require("./interface/swagger.json"));
const AuthorizationController = tslib_1.__importStar(require("./controllers/authorizations-controller"));
const TransfersController = tslib_1.__importStar(require("./controllers/transfers-controller"));
const TransactionRequestErrorsController = tslib_1.__importStar(require("./controllers/transaction-request-errors-controller"));
const AuthorizationErrorsController = tslib_1.__importStar(require("./controllers/authorization-errors-controller"));
const QuoteErrorsController = tslib_1.__importStar(require("./controllers/quote-errors-controller"));
const TransferErrorsController = tslib_1.__importStar(require("./controllers/transfer-errors-controller"));
const CentralLogger = require('@mojaloop/central-services-logger');
async function createApp(services, config) {
    const adaptor = new hapi_1.Server(config);
    // register services
    adaptor.app.authorizationsService = services.authorizationsService;
    adaptor.app.mojaClient = services.mojaClient;
    adaptor.app.queueService = services.queueService;
    adaptor.app.logger = services.logger;
    await adaptor.register({
        plugin: require('hapi-openapi'),
        options: {
            api: swagger_json_1.default,
            handlers: {
                health: {
                    get: () => ({ status: 'ok' })
                },
                transactionRequests: {
                    '{ID}': {
                        put: TransactionRequestsController.update,
                        error: {
                            put: TransactionRequestErrorsController.create
                        }
                    }
                },
                authorizations: {
                    '{ID}': {
                        get: AuthorizationController.show,
                        error: {
                            put: AuthorizationErrorsController.create
                        }
                    }
                },
                parties: {
                    '{Type}': {
                        '{ID}': {
                            put: PartiesController.update
                        }
                    }
                },
                quotes: {
                    post: QuotesController.create,
                    '{ID}': {
                        put: QuotesController.update,
                        error: {
                            put: QuoteErrorsController.create
                        }
                    }
                },
                transfers: {
                    post: TransfersController.create,
                    '{ID}': {
                        put: TransfersController.update,
                        error: {
                            put: TransferErrorsController.create
                        }
                    }
                }
            }
        }
    });
    return adaptor;
}
exports.createApp = createApp;
//# sourceMappingURL=adaptor.js.map