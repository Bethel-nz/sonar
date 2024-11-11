import { logger } from "~utils/logger";

export class EventQueueManager {
  private queues: Map<string, Promise<any>>;

  constructor() {
    this.queues = new Map();
  }

  async enqueue(queueKey: string, task: () => Promise<any>): Promise<any> {
    const currentQueue = this.queues.get(queueKey) || Promise.resolve();

    const newQueue = currentQueue.then(task).catch(error => {
      logger.error(`Error processing event in queue ${queueKey}:`, error);
      throw error;
    }).finally(() => {
      if (this.queues.get(queueKey) === newQueue) {
        this.queues.delete(queueKey);
      }
    });

    this.queues.set(queueKey, newQueue);
    return newQueue;
  }
} 