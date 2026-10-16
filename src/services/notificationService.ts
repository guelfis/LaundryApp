import { messaging } from "../firebaseConfig";
import { register, onRegistered } from "firebase/messaging";
import { supabase } from "../lib/supabase";

export const requestNotificationPermission = async (profileId: string): Promise<void> => {
  try {
    // Check if the browser supports notifications and if messaging initialized cleanly
    if (!messaging || !('Notification' in window) || !('serviceWorker' in navigator)) {
      console.warn("Push notifications are disabled or unsupported in this network environment.");
      return;
    }

    const permission: NotificationPermission = await Notification.requestPermission();
    
    if (permission !== "granted") {
      console.log("Notification permission denied by the user.");
      return;
    }

    // Pass messaging safely now that TypeScript knows it is not null
    onRegistered(messaging, async (installationId: string) => {
      if (!installationId) return;

      await supabase
        .from("user_fcm_tokens")
        .upsert({ 
          profile_id: profileId, 
          fcm_token: installationId,
          device_type: "web"
        }, { onConflict: "fcm_token" });
    });

    await register(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
    });

  } catch (error) {
    console.error("An error occurred during notification registration:", error);
  }
};
