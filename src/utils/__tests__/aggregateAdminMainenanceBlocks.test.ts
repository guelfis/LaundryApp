import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

// 1. Define a variable to dynamically change timezones if needed
const mockTimezone = 'Europe/Zurich';

// 2. Mock the module path cleanly
vi.mock('./getters', () => ({
  getHouseholdTimezone: () => mockTimezone
}));

// Import the function after defining the mock so it uses the mocked instance
import { Booking, SlotsPolicy } from '../../lib/databaseTypes';
import { standardSlots } from '../../constants/dates';
import { aggregateAdminMaintenanceBlocks } from '../slotsUtils';
import * as getters from '../getters';

// 🛠️ Helper function to construct full valid Booking objects with defaults
const createMockBooking = (overrides: Partial<Booking>): Booking => {
  return {
    id: 'mock-id',
    start_time: '',
    end_time: '',
    status: 'admin',
    apartment_id: null,
    created_at: '2026-09-24T12:00:00Z',
    created_by: 'system',
    notes: null,
    released_at: null,
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
    const bookings: Booking[] = [
      createMockBooking({ id: '1', start_time: '2026-09-24T08:00:00Z', end_time: '2026-09-24T10:00:00Z' }),
      createMockBooking({ id: '2', start_time: '2026-09-24T10:00:00Z', end_time: '2026-09-24T12:00:00Z' })
    ];

    const result = aggregateAdminMaintenanceBlocks(bookings, policy);
    expect(result).toHaveLength(1);
    expect(result[0].start_time).toBe('2026-09-24T08:00:00Z');
    expect(result[0].end_time).toBe('2026-09-24T12:00:00Z');
  });

  it('should bridge the overnight gap when a block ends at 22:00 Zurich time and next starts at 07:00 Zurich time', () => {
    const bookings: Booking[] = [
      createMockBooking({ id: '1', start_time: '2026-09-24T18:00:00Z', end_time: '2026-09-24T20:00:00Z' }),
      createMockBooking({ id: '2', start_time: '2026-09-25T05:00:00Z', end_time: '2026-09-25T09:00:00Z' })
    ];

    const result = aggregateAdminMaintenanceBlocks(bookings, policy);
    expect(result).toHaveLength(1);
    expect(result[0].start_time).toBe('2026-09-24T18:00:00Z');
    expect(result[0].end_time).toBe('2026-09-25T09:00:00Z');
  });

  it('should separate slots if there is a gap during the operational day hours', () => {
    const bookings: Booking[] = [
      createMockBooking({ id: '1', start_time: '2026-09-24T08:00:00Z', end_time: '2026-09-24T10:00:00Z' }),
      createMockBooking({ id: '2', start_time: '2026-09-24T11:00:00Z', end_time: '2026-09-24T13:00:00Z' })
    ];

    const result = aggregateAdminMaintenanceBlocks(bookings, policy);
    expect(result).toHaveLength(2);
  });
});

describe('aggregateAdminMaintenanceBlocks - DST Boundaries', () => {
  const policy: SlotsPolicy = { startHour: 7, endHour: 22, slots: standardSlots };

  it('should successfully bridge slots during the Spring Forward switch', () => {
    const bookings: Booking[] = [
      createMockBooking({ id: 'dst-s1', start_time: '2026-03-28T18:00:00Z', end_time: '2026-03-28T21:00:00Z' }),
      createMockBooking({ id: 'dst-s2', start_time: '2026-03-29T05:00:00Z', end_time: '2026-03-29T09:00:00Z' })
    ];

    const result = aggregateAdminMaintenanceBlocks(bookings, policy);
    expect(result).toHaveLength(1);
    expect(result[0].start_time).toBe('2026-03-28T18:00:00Z');
    expect(result[0].end_time).toBe('2026-03-29T09:00:00Z');
  });

  it('should successfully bridge slots during the Autumn Fall Back switch', () => {
    const bookings: Booking[] = [
      createMockBooking({ id: 'dst-f1', start_time: '2026-10-24T18:00:00Z', end_time: '2026-10-24T20:00:00Z' }),
      createMockBooking({ id: 'dst-f2', start_time: '2026-10-25T06:00:00Z', end_time: '2026-10-25T09:00:00Z' })
    ];

    const result = aggregateAdminMaintenanceBlocks(bookings, policy);
    expect(result).toHaveLength(1);
    expect(result[0].start_time).toBe('2026-10-24T18:00:00Z');
    expect(result[0].end_time).toBe('2026-10-25T09:00:00Z');
  });
});

describe('The Ultimate Production Proof', () => {
  const policy: SlotsPolicy = { startHour: 7, endHour: 22 , slots: standardSlots };

  beforeEach(() => {
    // Force the JavaScript runtime process to think it's running on a server in UTC
    vi.stubEnv('TZ', 'UTC'); 
    vi.spyOn(getters, 'getHouseholdTimezone').mockReturnValue('Europe/Zurich');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('fails on old code because server is UTC but building is Zurich', () => {
    const bookings: Booking[] = [
      // 22:00 Zurich time is 20:00:00Z UTC
      createMockBooking({ id: '1', start_time: '2026-09-24T18:00:00Z', end_time: '2026-09-24T20:00:00Z' }),
      // 07:00 Zurich time is 05:00:00Z UTC
      createMockBooking({ id: '2', start_time: '2026-09-25T05:00:00Z', end_time: '2026-09-25T09:00:00Z' })
    ];

    const result = aggregateAdminMaintenanceBlocks(bookings, policy);
    
    expect(result).toHaveLength(1); 
  });
});

