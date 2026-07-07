/**
 * Service Worker for Web Push Notifications
 * Part of the Reminder Framework
 */

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.body || data.label || 'You have a reminder',
      icon: '/icon.png',
      badge: '/icon.png',
      vibrate: [200, 100, 200],
      tag: data.reminderId ? `reminder-${data.reminderId}` : 'reminder',
      renotify: true,
      requireInteraction: true,
      data: {
        type: data.type || 'reminder',
        reminderId: data.reminderId,
        entityType: data.entityType,
        entityId: data.entityId,
        url: self.registration.scope,
      },
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Reminder', options)
    );
  } catch (e) {
    console.error('Push event error:', e);
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const url = data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
