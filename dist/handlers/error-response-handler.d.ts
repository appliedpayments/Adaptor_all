import { AdaptorServices } from '../adaptor';
import { MojaloopErrorQueueMessage } from '../types/queueMessages';
export declare function errorResponseHandler({ logger, queueService }: AdaptorServices, { type, typeId }: MojaloopErrorQueueMessage): Promise<void>;
