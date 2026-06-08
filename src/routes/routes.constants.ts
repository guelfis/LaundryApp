export const ROUTES = {
  // Public Space Paths
  LOGIN: '/login',

  // Onboarding Space Paths
  HOUSEHOLD_LOGIN: '/household-login',
  HOUSEHOLD_SETUP: '/household-setup',
  APARTMENT_LOGIN: '/apartment-login',

  // Authenticated Core App Space Paths
  DASHBOARD_ROOT: '/dashboard',
  DASHBOARD_MAIN: '/dashboard',
  DASHBOARD_CALENDAR: '/dashboard/calendar',
  DASHBOARD_APARTMENT: '/dashboard/apartment',
  DASHBOARD_SETTINGS: '/dashboard/settings',
} as const;

// Create a TypeScript type helper from the object keys if needed
export type AppRouteType = typeof ROUTES[keyof typeof ROUTES];
