import { Analytics, getAnalytics } from "firebase/analytics";
import { initializeApp, FirebaseApp } from "firebase/app";
import { getMessaging, Messaging, isSupported } from "firebase/messaging"; // 1. Import isSupported

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize the Firebase core application instance
const app: FirebaseApp = initializeApp(firebaseConfig);
export const analytics: Analytics = getAnalytics(app);

// 2. Initialize messaging conditionally to prevent crashes on insecure HTTP environments
export let messaging: Messaging | null = null;

// Use a self-invoking block or immediate check to assign messaging safely
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  // isSupported() is an official Firebase promise that verifies environment capabilities
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    } else {
      console.warn("FCM Messaging is not supported in this browser context.");
    }
  }).catch((err) => {
    console.error("Failed to evaluate notification environment compatibility:", err);
  });
}
