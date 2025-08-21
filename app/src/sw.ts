/// <reference lib="webworker" />

// Service Worker for fuselink PWA
// Handles push notifications, offline functionality, and background sync

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'fuselink-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        // Take control immediately
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all clients
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // If both cache and network fail, return offline page for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Push event - handle push notifications for sync requests
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  
  const notificationOptions = {
    title: data.title || 'Fuselink Sync Request',
    body: data.body || 'A device is requesting to sync with you',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'sync-request',
    data: {
      url: '/',
      action: 'sync',
      deviceId: data.deviceId,
      folderId: data.folderId,
    },
    actions: [
      {
        action: 'sync',
        title: 'Sync Now'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationOptions.title,
      notificationOptions
    )
  );
});

// Notification click event - handle user interactions
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event);
  
  event.notification.close();

  if (event.action === 'sync') {
    // Open app and navigate to sync page
    event.waitUntil(
      self.clients.matchAll({ type: 'window' })
        .then((clients) => {
          // If app is already open, focus it
          for (const client of clients) {
            if (client.url === self.location.origin && 'focus' in client) {
              return client.focus();
            }
          }
          // Otherwise, open new window
          if (self.clients.openWindow) {
            return self.clients.openWindow('/sync');
          }
        })
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default click - open app
    event.waitUntil(
      self.clients.matchAll({ type: 'window' })
        .then((clients) => {
          for (const client of clients) {
            if (client.url === self.location.origin && 'focus' in client) {
              return client.focus();
            }
          }
          if (self.clients.openWindow) {
            return self.clients.openWindow('/');
          }
        })
    );
  }
});

// Background sync event - handle deferred sync operations
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Notify the app that a background sync was requested
      self.clients.matchAll({ includeUncontrolled: true })
        .then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'BACKGROUND_SYNC',
              tag: event.tag
            });
          });
        })
    );
  }
});

// Message event - handle messages from main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

export {};