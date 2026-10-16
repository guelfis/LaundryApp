import { describe, it, expect, vi, beforeEach } from "vitest";
import { register, Messaging } from "firebase/messaging";

// 1. Mock 'firebaseConfig' FIRST to completely prevent the real getMessaging() from running
vi.mock("../../firebaseConfig", () => ({
  messaging: { mockInstance: "fcm_messaging_context_id" } as unknown as Messaging,
}));

// 2. Partially mock firebase/messaging, keeping actual exports intact but stubbing registration
vi.mock("firebase/messaging", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/messaging")>();
  return {
    ...actual,
    register: vi.fn(() => Promise.resolve()),
    onRegistered: vi.fn((_, callback: (id: string) => Promise<void>) => {
      customGlobal.triggerFirebaseRegistration = callback;
    }),
  };
});

// 3. Mock Supabase client hooks
vi.mock("../../lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

// Import the service file after setting up environmental mocks
import { requestNotificationPermission } from "../notificationService";
import { supabase } from "../../lib/supabase";

interface CustomGlobal {
  triggerFirebaseRegistration?: (installationId: string) => Promise<void>;
}

const customGlobal = globalThis as typeof globalThis & CustomGlobal;

describe("requestNotificationPermission workflow", () => {
  const mockProfileId = "user-profile-uuid-12345";

  beforeEach(() => {
    vi.clearAllMocks();
    delete customGlobal.triggerFirebaseRegistration;
  });

  it("should exit immediately and do nothing if notification permission is denied", async () => {
    vi.stubGlobal("Notification", {
      requestPermission: vi.fn().mockResolvedValue("denied"),
    });

    await requestNotificationPermission(mockProfileId);

    expect(register).not.toHaveBeenCalled();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("should register with Firebase and sync the token to Supabase when permission is granted", async () => {
    vi.stubGlobal("Notification", {
      requestPermission: vi.fn().mockResolvedValue("granted"),
    });

    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue({
      upsert: mockUpsert,
    } as never);

    // Initiate the setup promise execution chain
    const registrationPromise = requestNotificationPermission(mockProfileId);

    const fakeInstallationId = "mock-firebase-fid-token-xyz-98765";

    // Defer the execution loop to let requestNotificationPermission evaluate register() first
    await new Promise<void>((resolve) => {
      setTimeout(async () => {
        if (customGlobal.triggerFirebaseRegistration) {
          await customGlobal.triggerFirebaseRegistration(fakeInstallationId);
        }
        resolve();
      }, 0);
    });

    await registrationPromise;

    // Verify Firebase registration initiated with environmental variables
    expect(register).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ vapidKey: expect.any(String) })
    );

    // Verify the database transaction was invoked correctly
    expect(supabase.from).toHaveBeenCalledWith("user_fcm_tokens");
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        profile_id: mockProfileId,
        fcm_token: fakeInstallationId,
        device_type: "web",
      },
      { onConflict: "fcm_token" }
    );
  });
});
