import { useState, useEffect, useCallback } from 'react';
import { messaging } from '../firebaseConfig';
import { isSupported, Messaging } from 'firebase/messaging';
import { requestNotificationPermission } from '../services/notificationService';

interface ExtendedMessaging extends Messaging {
  _registrationToken?: string;
}

export function useNotificationStatus(profileId: string) {
  const [isDeviceEnabled, setIsDeviceEnabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRequesting, setIsRequesting] = useState<boolean>(false);

  const checkDeviceStatus = useCallback(async () => {
    try {
      // 1. Verify if the browser environment supports notifications at all
      const supported = await isSupported();
      if (!supported || !messaging) {
        setIsDeviceEnabled(true); // Default to true to hide banners on unsupported platforms
        return;
      }

      // 2. Check the native browser permission state
      const currentPermission = Notification.permission;
      if (currentPermission !== 'granted') {
        setIsDeviceEnabled(false);
        return;
      }

      // 3. Confirm Firebase has an active installation session on this specific browser instance
      // We safely cast messaging using our explicit ExtendedMessaging type interface
      const extendedMessaging = messaging as ExtendedMessaging;
      const activeRegistrationToken = extendedMessaging._registrationToken || null;
      
      setIsDeviceEnabled(!!activeRegistrationToken);

    } catch (err) {
      console.error('Error verifying device notification capability:', err);
      setIsDeviceEnabled(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkDeviceStatus();
  }, [checkDeviceStatus]);

  const enableNotifications = async () => {
    setIsRequesting(true);
    try {
      await requestNotificationPermission(profileId);
      // Re-evaluate the local state instantly after the prompt finishes
      if (Notification.permission === 'granted') {
        setIsDeviceEnabled(true);
      }
    } catch (err) {
      console.error('Failed to enable notifications on this device:', err);
    } finally {
      setIsRequesting(false);
    }
  };

  return {
    isDeviceEnabled,
    isLoading,
    isRequesting,
    enableNotifications,
    refreshStatus: checkDeviceStatus // Expose this so the Settings page can re-trigger a check manually
  };
}
