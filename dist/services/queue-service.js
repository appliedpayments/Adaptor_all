"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
class BullQueueService {
    constructor(queues, redisConnection) {
        this._queues = new Map();
        queues.forEach(name => {
            this._queues.set(name, new bullmq_1.Queue(name, {
                connection: redisConnection !== null && redisConnection !== void 0 ? redisConnection : { host: 'localhost', port: 6379 }
            }));
        });
    }
    async getQueues() {
        return this._queues;
    }
    async addToQueue(name, payload) {
        const queue = this._queues.get(name);
        if (queue) {
            queue.add(name, payload);
        }
        else {
            throw new Error(`Cannot find queue with name: ${name}`);
        }
    }
    async shutdown() {
        await Promise.all(Array.from(this._queues.values()).map(queue => queue.close()));
        this._queues.clear();
    }
}
exports.BullQueueService = BullQueueService;
//# sourceMappingURL=queue-service.js.map