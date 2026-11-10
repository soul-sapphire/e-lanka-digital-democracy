/**
 * E-Lanka Digital Democracy Platform
 * Ultra-Low Bandwidth Offline Queue Manager
 *
 * Stores survey responses in localStorage / IndexedDB when citizen is offline
 * and automatically drains the queue when connectivity is restored.
 */

const QUEUE_STORAGE_KEY = 'elanka_offline_survey_queue';

export interface QueuedSubmission {
  id: string;
  surveyId: string;
  policyId: string;
  citizenIdentifier: string;
  answers: any[];
  clientLanguage: string;
  queuedAt: string;
}

export class OfflineQueueManager {
  public static getQueue(): QueuedSubmission[] {
    try {
      const data = localStorage.getItem(QUEUE_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static enqueue(submission: Omit<QueuedSubmission, 'id' | 'queuedAt'>): QueuedSubmission {
    const queue = this.getQueue();
    const item: QueuedSubmission = {
      ...submission,
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      queuedAt: new Date().toISOString()
    };
    queue.push(item);
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    return item;
  }

  public static clearQueue(): void {
    localStorage.removeItem(QUEUE_STORAGE_KEY);
  }

  public static async drainQueue(): Promise<{ synced: number; remaining: number }> {
    const queue = this.getQueue();
    if (queue.length === 0) return { synced: 0, remaining: 0 };

    try {
      const response = await fetch('/api/v1/surveys/batch-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue })
      });

      if (response.ok) {
        this.clearQueue();
        return { synced: queue.length, remaining: 0 };
      }
    } catch (e) {
      console.warn('[OfflineQueue] Failed to drain queue, network still unstable');
    }

    return { synced: 0, remaining: queue.length };
  }
}

