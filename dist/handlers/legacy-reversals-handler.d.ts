import { AdaptorServices } from 'adaptor';
import { LegacyReversalRequest } from '../types/adaptor-relay-messages';
export declare function legacyReversalHandler({ logger, mojaClient, queueService }: AdaptorServices, reversalRequest: LegacyReversalRequest): Promise<void>;
