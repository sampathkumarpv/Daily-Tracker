/**
 * Activity Log API - localStorage-based persistence for activity events
 * All timestamps stored in milliseconds
 */

import type { ActivityEvent, ActivityEventType, Status } from '../types';

const STORAGE_KEY = 'tm_activity_log';

function loadFromStorage(): ActivityEvent[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch {
    return [];
  }
}

function saveToStorage(events: ActivityEvent[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

/** Get start of day in milliseconds */
function getStartOfDay(millis: number): number {
  const d = new Date(millis);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Get end of day in milliseconds */
function getEndOfDay(millis: number): number {
  const d = new Date(millis);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

/** Parse date string or millis to millis */
function toMillis(date: string | number): number {
  if (typeof date === 'number') return date;
  return new Date(date).getTime();
}

export const activityLogApi = {
  getAll(): Promise<ActivityEvent[]> {
    return Promise.resolve(loadFromStorage());
  },

  /**
   * Get events by date range (accepts millis or ISO/YYYY-MM-DD strings)
   */
  getByDateRange(from: string | number, to: string | number): Promise<ActivityEvent[]> {
    const events = loadFromStorage();
    const fromMillis = getStartOfDay(toMillis(from));
    const toMillis_ = getEndOfDay(toMillis(to));

    return Promise.resolve(
      events.filter((e) => e.timestamp >= fromMillis && e.timestamp <= toMillis_)
    );
  },

  /**
   * Get events by single date (accepts millis or ISO/YYYY-MM-DD string)
   */
  getByDate(date: string | number): Promise<ActivityEvent[]> {
    return this.getByDateRange(date, date);
  },

  add(event: Omit<ActivityEvent, 'id'>): Promise<ActivityEvent> {
    const events = loadFromStorage();
    const newEvent: ActivityEvent = {
      ...event,
      id: `ae_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    };
    events.unshift(newEvent); // Add to beginning (newest first)
    saveToStorage(events);
    return Promise.resolve(newEvent);
  },

  logTaskCreated(taskId: string, taskTag: string, title: string): Promise<ActivityEvent> {
    return this.add({
      type: 'created',
      taskId,
      taskTag,
      title,
      timestamp: Date.now(),
    });
  },

  logStatusChanged(
    taskId: string,
    taskTag: string,
    title: string,
    from: Status,
    to: Status
  ): Promise<ActivityEvent> {
    const eventType: ActivityEventType = to === 'done' ? 'completed' : 'status_changed';
    return this.add({
      type: eventType,
      taskId,
      taskTag,
      title,
      from,
      to,
      timestamp: Date.now(),
    });
  },

  logNotecardCreated(
    notecardId: string,
    title: string,
    notebookId: string,
    notebookName: string
  ): Promise<ActivityEvent> {
    return this.add({
      type: 'notecard_created',
      title,
      notebookId,
      notebookName,
      notecardId,
      timestamp: Date.now(),
    });
  },

  logReminderFired(label: string): Promise<ActivityEvent> {
    return this.add({
      type: 'reminder_fired',
      title: label,
      timestamp: Date.now(),
    });
  },

  logNotebookCreated(notebookId: string, name: string): Promise<ActivityEvent> {
    return this.add({
      type: 'notebook_created',
      title: name,
      notebookId,
      notebookName: name,
      timestamp: Date.now(),
    });
  },

  logNotecardUpdated(
    notecardId: string,
    title: string,
    notebookId: string,
    notebookName: string
  ): Promise<ActivityEvent> {
    return this.add({
      type: 'notecard_updated',
      title,
      notebookId,
      notebookName,
      notecardId,
      timestamp: Date.now(),
    });
  },

  logScratchpadUpdated(): Promise<ActivityEvent> {
    return this.add({
      type: 'scratchpad_updated',
      title: 'Scratchpad updated',
      timestamp: Date.now(),
    });
  },

  // Clear all events
  clear(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
    return Promise.resolve();
  },
};
