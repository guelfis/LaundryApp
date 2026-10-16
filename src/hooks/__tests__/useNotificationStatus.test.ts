import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotificationStatus } from '../useNotificationStatus';
import { Messaging } from 'firebase/messaging';
import { requestNotificationPermission } from '../../services/notificationService';

// Define a strict interface extension inside the test file to avoid 'any'
interface ExtendedMessaging extends Messaging {
  _registrationToken?: string;
}

// 1. Mock 'firebaseConfig' FIRST with a valid mock instance skeleton
vi.mock('../../firebaseConfig', () => ({
  messaging: { 
    mockInstance: 'fcm_context_id',
    _registrationToken: undefined 
  } as unknown as Messaging,
}));

// 2. Mock the messaging module layer completely to support our environment state checks
vi.mock('firebase/messaging', () => ({
  isSupported: vi.fn(() => Promise.resolve(true)), // Always passes the guard clause in tests
}));

// 3. Mock your custom background service prompt pipeline
vi.mock('../../services/notificationService', () => ({
  requestNotificationPermission: vi.fn(() => Promise.resolve()),
}));

describe('useNotificationStatus custom hook', () => {
  const mockProfileId = 'user-profile-uuid-12345';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return disabled if browser permissions have not been granted yet', async () => {
    vi.stubGlobal('Notification', { permission: 'default' });

    const { result } = renderHook(() => useNotificationStatus(mockProfileId));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isDeviceEnabled).toBe(false);
  });

  it('should return enabled if browser permissions are granted and firebase registration token is found', async () => {
    vi.stubGlobal('Notification', { permission: 'granted' });
    
    const { messaging } = await import('../../firebaseConfig');
    const extendedMessaging = messaging as ExtendedMessaging;
    extendedMessaging._registrationToken = 'active-fcm-browser-token-value';

    const { result } = renderHook(() => useNotificationStatus(mockProfileId));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isDeviceEnabled).toBe(true);
  });

  it('should trigger the service workflow when enableNotifications is invoked', async () => {
    vi.stubGlobal('Notification', { permission: 'default' });
    
    const { messaging } = await import('../../firebaseConfig');
    const extendedMessaging = messaging as ExtendedMessaging;
    extendedMessaging._registrationToken = undefined;

    const { result } = renderHook(() => useNotificationStatus(mockProfileId));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isDeviceEnabled).toBe(false);

    // Simulate permission shift when the user clicks 'Allow' inside the prompt loop
    vi.stubGlobal('Notification', { permission: 'granted' });

    await act(async () => {
      await result.current.enableNotifications();
    });

    expect(requestNotificationPermission).toHaveBeenCalledWith(mockProfileId);
    expect(result.current.isDeviceEnabled).toBe(true);
  });
});
