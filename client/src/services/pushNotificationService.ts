/**
 * Web Push Notification Service
 * Handles service worker registration and push subscription.
 * Part of the Reminder Framework.
 */

import { getVapidPublicKey, registerPushSubscription, unregisterPushSubscription } from '../api/reminders';

// Convert base64 to Uint8Array (for VAPID key)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private vapidPublicKey: string | null = null;
  private enabled = false;

  /**
   * Initialize the push notification service.
   * Registers the service worker and checks for existing subscription.
   */
  async init(): Promise<boolean> {
    // Check if push is supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      // Get VAPID public key from backend
      const { publicKey, enabled } = await getVapidPublicKey();
      if (!enabled || !publicKey) {
        console.warn('Push notifications disabled on server (no VAPID keys)');
        return false;
      }
      this.vapidPublicKey = publicKey;
      this.enabled = true;

      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service worker registered');

      // Check for existing subscription
      this.subscription = await this.registration.pushManager.getSubscription();
      if (this.subscription) {
        console.log('Existing push subscription found');
        // Re-register with backend in case it was lost
        await this.syncSubscription();
      }

      return true;
    } catch (error) {
      console.error('Push init error:', error);
      return false;
    }
  }

  /**
   * Check if push notifications are available.
   */
  isAvailable(): boolean {
    return this.enabled && this.registration !== null;
  }

  /**
   * Check if currently subscribed.
   */
  isSubscribed(): boolean {
    return this.subscription !== null;
  }

  /**
   * Request notification permission and subscribe.
   */
  async subscribe(): Promise<boolean> {
    if (!this.registration || !this.vapidPublicKey) {
      console.error('Push not initialized');
      return false;
    }

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return false;
      }

      // Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(this.vapidPublicKey);
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      // Register subscription with backend
      await this.syncSubscription();

      console.log('Push subscription created');
      return true;
    } catch (error) {
      console.error('Push subscribe error:', error);
      return false;
    }
  }

  /**
   * Unsubscribe from push notifications.
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return true;
    }

    try {
      const endpoint = this.subscription.endpoint;

      // Unsubscribe locally
      await this.subscription.unsubscribe();
      this.subscription = null;

      // Unregister from backend
      await unregisterPushSubscription(endpoint);

      console.log('Push subscription removed');
      return true;
    } catch (error) {
      console.error('Push unsubscribe error:', error);
      return false;
    }
  }

  /**
   * Sync subscription with backend.
   */
  private async syncSubscription(): Promise<void> {
    if (!this.subscription) return;

    const json = this.subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      console.error('Invalid subscription format');
      return;
    }

    await registerPushSubscription(
      json.endpoint,
      json.keys.p256dh,
      json.keys.auth,
      navigator.userAgent
    );
  }

  /**
   * Get the current permission state.
   */
  getPermissionState(): NotificationPermission | 'unsupported' {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }
}

// Singleton instance
export const pushNotificationService = new PushNotificationService();
