export type QueueJob = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
};

type Handler = (job: QueueJob) => Promise<void>;

export class InMemoryQueue {
  private handlers = new Map<string, Handler>();
  private pending: QueueJob[] = [];
  private processing = false;

  register(type: string, handler: Handler) {
    this.handlers.set(type, handler);
  }

  async enqueue(type: string, payload: Record<string, unknown>) {
    const job: QueueJob = {
      id: crypto.randomUUID(),
      type,
      payload,
      attempts: 0,
      maxAttempts: 5,
      createdAt: new Date().toISOString(),
    };
    this.pending.push(job);
    void this.process();
    return job.id;
  }

  private async process() {
    if (this.processing) return;
    this.processing = true;
    while (this.pending.length > 0) {
      const job = this.pending.shift()!;
      const handler = this.handlers.get(job.type);
      if (!handler) continue;
      try {
        job.attempts += 1;
        await handler(job);
      } catch (err) {
        console.error('[logstoka-queue]', job.type, err);
        if (job.attempts < job.maxAttempts) {
          this.pending.push(job);
        }
      }
    }
    this.processing = false;
  }
}

export const logstokaQueue = new InMemoryQueue();
