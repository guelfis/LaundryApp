import { supabase } from "../lib/supabase";

/**
 * Clean and retrieve a string value safely from localStorage, 
 * stripping away any accidental persistent string quotes.
 */
export function getCleanStorageItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  const item = localStorage.getItem(key);
  if (!item) return null;
  return item.replace(/['"]+/g, '').trim();
}

/**
 * Verifies if a specific user holds administrative permissions 
 * within a structured database member roster payload array.
 */
export function checkIsAdmin(
  members: Array<{ user_id: string; role: string }>, 
  userId: string | null
): boolean {
  if (!userId || !members || members.length === 0) return false;
  
  const cleanUserId = userId.replace(/['"]+/g, '').trim().toLowerCase();
  
  return members.some(
    (member) => member.user_id.toLowerCase() === cleanUserId && member.role === 'admin'
  );
}

/**
 * Async token resolver that safely checks the live Supabase session 
 * first before falling back to local hybrid browser storage variants.
 */
export async function resolveCurrentUserId(): Promise<string | null> {
  try {
    // Priority 1: Live session engine check
    const { data } = await supabase.auth.getSession();
    if (data.session?.user?.id) {
      return data.session.user.id;
    }
  } catch (e) {
    console.warn("Supabase session check skipped or unavailable:", e);
  }

  // Priority 2: Alternative standard storage keys
  return getCleanStorageItem('userId') || getCleanStorageItem('user_id');
}
