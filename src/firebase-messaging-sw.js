// src/firebase-messaging-sw.js
import { precacheAndRoute } from 'workbox-precaching';

// This injects the internal PWA asset cache list during build time
precacheAndRoute(self.__WB_MANIFEST || []);

importScripts('https://gstatic.com');
importScripts('https://gstatic.com');

// Vite will replace these placeholders with your real keys automatically during the build!
firebase.initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || "Laundry App";
  const notificationOptions = {
    body: payload.notification?.body || "Update on your shift.",
    icon: '/pwa-192x192.png'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
