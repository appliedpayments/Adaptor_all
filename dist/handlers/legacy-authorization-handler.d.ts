import { AdaptorServices } from '../adaptor';
import { LegacyAuthorizationRequest } from '../types/adaptor-relay-messages';
export declare function legacyAuthorizationRequestHandler({ logger, mojaClient, queueService }: AdaptorServices, legacyAuthorizationRequest: LegacyAuthorizationRequest): Promise<void>;
