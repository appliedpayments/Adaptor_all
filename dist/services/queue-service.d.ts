import { Queue, ConnectionOptions } from 'bullmq';
export interface QueueService {
    addToQueue(name: string, payload: {
        [k: string]: any;
    }): Promise<void>;
    shutdown(): Promise<void>;
}
export declare class BullQueueService implements QueueService {
    private _queues;
    constructor(queues: string[], redisConnection?: ConnectionOptions);
    getQueues(): Promise<Map<string, Queue>>;
    addToQueue(name: string, payload: {
        [k: string]: any;
    }): Promise<void>;
    shutdown(): Promise<void>;
}
