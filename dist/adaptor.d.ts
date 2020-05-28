import { Server } from 'hapi';
import { AuthorizationsService } from './services/authorizations-service';
import { MojaloopRequests } from '@mojaloop/sdk-standard-components';
import { QueueService } from './services/queue-service';
import { Transaction } from './models';
import { Money } from './types/mojaloop';
import { IlpService } from './services/ilp-service';
export declare type AdaptorConfig = {
    port?: number | string;
    host?: string;
};
export declare type AdaptorServices = {
    authorizationsService: AuthorizationsService;
    mojaClient: MojaloopRequests;
    logger: Logger;
    queueService: QueueService;
    calculateAdaptorFees: (transaction: Transaction) => Promise<Money>;
    ilpService: IlpService;
};
export declare type Logger = {
    info: (message: string) => void;
    warn: (message: string) => void;
    debug: (message: string) => void;
    error: (message: string) => void;
};
declare module 'hapi' {
    interface ApplicationState {
        authorizationsService: AuthorizationsService;
        mojaClient: MojaloopRequests;
        logger: Logger;
        queueService: QueueService;
        calculateAdaptorFees: (transaction: Transaction) => Promise<Money>;
        ilpService: IlpService;
    }
}
export declare function createApp(services: AdaptorServices, config?: AdaptorConfig): Promise<Server>;
