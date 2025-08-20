// Offline Queue Management
const QUEUE_KEY = 'sos.queue.v1';

export interface QueuedRequest {
  id: string;
  name: string;
  age: number;
  phone: string;
  message: string;
  coords: string;
  createdAt: string;
  lastModified: number;
  resolved: boolean;
  resolvedAt: string | null;
  priority: string;
  category: string;
  priorityScore: number;
  reasoning: string;
}

export const loadQueue = (): QueuedRequest[] => {
  try {
    const stored = localStorage.getItem(QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading queue:', error);
    return [];
  }
};

export const saveQueue = (queue: QueuedRequest[]): void => {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error saving queue:', error);
  }
};

export const addToQueue = (request: QueuedRequest): void => {
  const queue = loadQueue();
  queue.push(request);
  saveQueue(queue);
};

export const clearQueue = (): void => {
  saveQueue([]);
};

export const getQueueLength = (): number => {
  return loadQueue().length;
};