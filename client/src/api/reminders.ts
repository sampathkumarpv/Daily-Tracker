import api from './client';
import type { Reminder, ReminderEntityType } from '../types';

/**
 * Reminder API - connects to backend reminder framework.
 * Supports polymorphic reminders (attach to any entity type).
 */

export interface CreateReminderRequest {
  entityType: ReminderEntityType;
  entityId: string;
  label: string;
  dueAt: number;       // milliseconds since epoch
  repeatRule?: string; // 'daily', 'weekly', 'monthly'
}

export interface UpdateReminderRequest {
  label?: string;
  dueAt?: number;
  repeatRule?: string;
}

export const remindersApi = {
  /**
   * Get all reminders for the organization.
   */
  getAll: async (): Promise<Reminder[]> => {
    const { data } = await api.get<Reminder[]>('/reminders');
    return data;
  },

  /**
   * Get pending (unfired) reminders.
   */
  getPending: async (): Promise<Reminder[]> => {
    const { data } = await api.get<Reminder[]>('/reminders/pending');
    return data;
  },

  /**
   * Get count of pending reminders.
   */
  getPendingCount: async (): Promise<number> => {
    const { data } = await api.get<{ count: number }>('/reminders/pending/count');
    return data.count;
  },

  /**
   * Get reminders for a specific entity.
   */
  getByEntity: async (entityType: ReminderEntityType, entityId: string): Promise<Reminder[]> => {
    const { data } = await api.get<Reminder[]>(`/reminders/entity/${entityType}/${entityId}`);
    return data;
  },

  /**
   * Get reminders by notecard ID (convenience method for backward compatibility).
   */
  getByNotecardId: async (notecardId: string): Promise<Reminder[]> => {
    return remindersApi.getByEntity('notecard', notecardId);
  },

  /**
   * Get a single reminder by ID.
   */
  getById: async (id: number): Promise<Reminder> => {
    const { data } = await api.get<Reminder>(`/reminders/${id}`);
    return data;
  },

  /**
   * Create a new reminder.
   */
  create: async (request: CreateReminderRequest): Promise<Reminder> => {
    const { data } = await api.post<Reminder>('/reminders', request);
    return data;
  },

  /**
   * Update a reminder.
   */
  update: async (id: number, request: UpdateReminderRequest): Promise<Reminder> => {
    const { data } = await api.put<Reminder>(`/reminders/${id}`, request);
    return data;
  },

  /**
   * Delete a reminder.
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/reminders/${id}`);
  },

  /**
   * Delete all reminders for an entity.
   */
  deleteByEntity: async (entityType: ReminderEntityType, entityId: string): Promise<void> => {
    await api.delete(`/reminders/entity/${entityType}/${entityId}`);
  },

  /**
   * Delete all reminders for a notecard (convenience method).
   */
  deleteByNotecardId: async (notecardId: string): Promise<void> => {
    return remindersApi.deleteByEntity('notecard', notecardId);
  },
};

// ==================== SSE Stream ====================

export type ReminderEventHandler = (reminder: Reminder) => void;

/**
 * Connect to the SSE stream for real-time reminder notifications.
 * Returns a cleanup function to close the connection.
 */
export function connectReminderStream(onReminder: ReminderEventHandler): () => void {
  const eventSource = new EventSource('/api/v1/reminders/stream');

  eventSource.addEventListener('reminder', (event) => {
    try {
      const reminder: Reminder = JSON.parse(event.data);
      onReminder(reminder);
    } catch (e) {
      console.error('Failed to parse reminder event:', e);
    }
  });

  eventSource.addEventListener('connected', () => {
    console.log('Connected to reminder stream');
  });

  eventSource.onerror = (error) => {
    console.error('Reminder stream error:', error);
  };

  // Return cleanup function
  return () => {
    eventSource.close();
  };
}

// ==================== Web Push ====================

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

/**
 * Get the VAPID public key for Web Push registration.
 */
export async function getVapidPublicKey(): Promise<{ publicKey: string; enabled: boolean }> {
  const { data } = await api.get<{ publicKey: string; enabled: boolean }>('/push/vapid-public-key');
  return data;
}

/**
 * Register a push subscription with the backend.
 */
export async function registerPushSubscription(
  endpoint: string,
  p256dhKey: string,
  authKey: string,
  userAgent?: string
): Promise<void> {
  await api.post('/push/subscribe', {
    endpoint,
    p256dhKey,
    authKey,
    userAgent,
  });
}

/**
 * Unsubscribe from push notifications.
 */
export async function unregisterPushSubscription(endpoint: string): Promise<void> {
  await api.post('/push/unsubscribe', { endpoint });
}
