export class TaskQueue {
  private queue: (() => Promise<any>)[] = [];
  private running = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent = 2) {
    this.maxConcurrent = maxConcurrent;
  }

  async enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
        this.processNext();
      });

      if (this.running < this.maxConcurrent) {
        this.processNext();
      }
    });
  }

  private processNext() {
    if (this.queue.length > 0 && this.running < this.maxConcurrent) {
      const task = this.queue.shift();
      if (task) {
        this.running++;
        task().finally(() => {
          this.running--;
        });
      }
    }
  }
}

const MAX_CONCURRENT_TASKS = process.env.MAX_CONCURRENT_TASKS
  ? parseInt(process.env.MAX_CONCURRENT_TASKS)
  : 2;

export const globalTaskQueue = new TaskQueue(MAX_CONCURRENT_TASKS);
