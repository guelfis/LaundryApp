import { describe, it, expect, vi, afterEach } from 'vitest';

// 1. Define a variable to dynamically change timezones if needed
const mockTimezone = 'Europe/Zurich';

// 2. Mock the module path cleanly
vi.mock('./getters', () => ({
  getHouseholdTimezone: () => mockTimezone
}));

// Import the function after defining the mock so it uses the mocked instance
import {SlotsPolicy } from '../../lib/databaseTypes';
import { standardSlots } from '../../constants/dates';
import { aggregateAdminMaintenanceBlocks } from '../slotsUtils';
import { NormalizedBooking } from '../normalizeBookings';

// 🛠️ Helper function to construct full valid Booking objects with defaults
const createMockBooking = (overrides: Partial<NormalizedBooking>): NormalizedBooking => {
  return {
    id: 'mock-id',
    dateStr:'',
    startHour: 0,
    endHour: 0,
    status: 'admin',
    apartment_id: null,
    created_at: '2026-09-24T12:00:00Z',
    created_by: 'system',
    notes: null,
    released_at: 0,
    ...overrides
  };
};

describe('aggregateAdminMaintenanceBlocks', () => {
  const policy: SlotsPolicy = { startHour: 7, endHour: 22, slots: standardSlots };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return an empty array if no bookings exist', () => {
    expect(aggregateAdminMaintenanceBlocks([], policy)).toEqual([]);
  });

  it('should combine overlapping or touching slots on the same day', () => {
    const bookings: NormalizedBooking[] = [
      createMockBooking({ id: '1', dateStr:'2026-09-24', startHour:7 , endHour: 12 }),
      createMockBooking({ id: '2', dateStr:'2026-09-24',startHour:12 , endHour: 17})
    ];

    const result = aggregateAdminMaintenanceBlocks(bookings, policy);
    expect(result).toHaveLength(1);
    expect(result[0].startDate).toBe('2026-09-24');
    expect(result[0].startHour == 7);
    expect(result[0].endDate).toBe('2026-09-24');
    expect(result[0].endHour == 17);
  });

  it('should bridge the overnight gap when a block ends at 22:00 Zurich time and next starts at 07:00 Zurich time', () => {
    const bookings: NormalizedBooking[] = [
      createMockBooking({ id: '1', dateStr:'2026-09-24', startHour:17 , endHour: 22 }),
      createMockBooking({ id: '2', dateStr:'2026-09-25',startHour:7 , endHour: 12})
    ];

    const result = aggregateAdminMaintenanceBlocks(bookings, policy);
    expect(result).toHaveLength(1);
    expect(result[0].startDate).toBe('2026-09-24');
    expect(result[0].startHour == 17);
    expect(result[0].endDate).toBe('2026-09-25');
    expect(result[0].endHour == 12);
  });

  it('should separate slots if there is a gap during the operational day hours', () => {
    const bookings: NormalizedBooking[] = [
      createMockBooking({ id: '1', dateStr:'2026-09-24', startHour:7 , endHour: 12 }),
      createMockBooking({ id: '2', dateStr:'2026-09-24', startHour:17 , endHour: 22})
    ];

    const result = aggregateAdminMaintenanceBlocks(bookings, policy);
    expect(result).toHaveLength(2);
  });
});

