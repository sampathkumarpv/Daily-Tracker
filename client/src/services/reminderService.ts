import type { Reminder } from '../types';
import { connectReminderStream } from '../api/reminders';
import { pushNotificationService } from './pushNotificationService';

/**
 * Reminder Service - handles real-time reminder notifications.
 * Uses SSE for real-time push from backend + Web Push for background notifications.
 *
 * Part of the Reminder Framework.
 */

type ReminderCallback = (reminder: Reminder) => void;

class ReminderService {
  private onFireCallback: ReminderCallback | null = null;
  private disconnectStream: (() => void) | null = null;
  private connected = false;

  /**
   * Set the callback for when a reminder fires.
   */
  setOnFireCallback(callback: ReminderCallback) {
    this.onFireCallback = callback;
  }

  /**
   * Start listening for reminder notifications.
   * Connects to SSE stream and initializes push notifications.
   */
  async start() {
    if (this.connected) return;

    // Connect to SSE stream for real-time notifications
    this.disconnectStream = connectReminderStream((reminder) => {
      this.handleReminder(reminder);
    });
    this.connected = true;

    // Initialize Web Push for background notifications
    try {
      await pushNotificationService.init();
      // Auto-subscribe if permission already granted
      if (pushNotificationService.getPermissionState() === 'granted') {
        await pushNotificationService.subscribe();
      }
    } catch (e) {
      console.warn('Web Push init failed (non-critical):', e);
    }

    console.log('Reminder service started');
  }

  /**
   * Stop listening for reminder notifications.
   */
  stop() {
    if (this.disconnectStream) {
      this.disconnectStream();
      this.disconnectStream = null;
    }
    this.connected = false;
    console.log('Reminder service stopped');
  }

  /**
   * Handle incoming reminder from SSE stream.
   */
  private handleReminder(reminder: Reminder) {
    console.log('Reminder received:', reminder.label);

    // Show browser notification (fallback if push not enabled)
    if ('Notification' in window && Notification.permission === 'granted') {
      // Only show if not using Web Push (avoid duplicates)
      if (!pushNotificationService.isSubscribed()) {
        new Notification('Reminder', {
          body: reminder.label,
          icon: '/icon.png',
          tag: `reminder-${reminder.id}`,
        });
      }
    }

    // Trigger callback for in-app toast
    if (this.onFireCallback) {
      this.onFireCallback(reminder);
    }
  }

  /**
   * Request permission for browser notifications.
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  /**
   * Subscribe to Web Push notifications (requires user gesture).
   */
  async subscribeToPush(): Promise<boolean> {
    return pushNotificationService.subscribe();
  }

  /**
   * Unsubscribe from Web Push notifications.
   */
  async unsubscribeFromPush(): Promise<boolean> {
    return pushNotificationService.unsubscribe();
  }

  /**
   * Check if connected to SSE stream.
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Check if subscribed to Web Push.
   */
  isPushSubscribed(): boolean {
    return pushNotificationService.isSubscribed();
  }
}

// Export singleton instance
export const reminderService = new ReminderService();
