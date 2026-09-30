import { describe, it, expect,vi, beforeEach, afterEach } from 'vitest';
import { 
  processAdminBlocks, 
  calculateMaxEndDate, 
  getAvailableSlotsForDate, 
  getFirstAvailableStartDate,
  calculatePayloadsForBooking, 
  addDaysToDateString,         
  AdminBlocksMap
} from '../adminModalUtils';
import { standardSlots } from '../../constants/dates';
import { NormalizedBooking } from '../normalizeBookings';

describe('Admin Booking Utility Suite', () => {
  const ADMIN_ID = 'admin-uuid-123';
  
  // Custom master slots matching your layout boundaries
  const MASTER_SLOTS = [[7, 12], [12, 17], [17, 22]];

  // Factory helper to quickly build full valid Booking objects for testing assertions
  const createMockBooking = (fields: Partial<NormalizedBooking>): NormalizedBooking => ({
    id: 'mock-id-' + Math.random(),
    apartment_id: null,
    created_at: new Date().toISOString(),
    created_by: null,
    dateStr:'',
    startHour: 0,
    endHour: 0,
    notes: null,
    released_at: 0,
    status: 'admin',
    ...fields
  });

  describe('processAdminBlocks', () => {
    it('should correctly map admin bookings and identify fully booked days', () => {
      const mockBookings: NormalizedBooking[] = [
        createMockBooking({ id: '1', dateStr:'2026-08-24', startHour:7 , endHour: 12, apartment_id: ADMIN_ID }),
        createMockBooking({ id: '2', dateStr:'2026-08-24', startHour:12 , endHour: 17, apartment_id: ADMIN_ID}),
        createMockBooking({ id: '3', dateStr:'2026-08-24', startHour:17 , endHour: 22, apartment_id: ADMIN_ID }),
        createMockBooking({ id: '4', dateStr:'2026-08-25', startHour:7 , endHour: 12, apartment_id: ADMIN_ID}),
      ];

      const result = processAdminBlocks(mockBookings, standardSlots, new Date('2026-08-24T14:30:00Z'));

      // August 24 has 3 admin blocks, matching total master slot capacity
      expect(result['2026-08-24'].isFullyBooked).toBe(true);
      expect(result['2026-08-24'].blockedSlots).toHaveLength(3);

      // August 25 has only 1 admin block
      expect(result['2026-08-25'].isFullyBooked).toBe(false);
      expect(result['2026-08-25'].blockedSlots).toEqual([[7, 12]]);
    });
  });

  describe('calculateMaxEndDate', () => {
    it('should return the next closest fully booked date as a ceiling', () => {
      const mockBlocksMap: AdminBlocksMap = {
        '2026-08-26': { blockedSlots: [], isFullyBooked: false },
        '2026-08-28': { blockedSlots: MASTER_SLOTS, isFullyBooked: true },
        '2026-08-30': { blockedSlots: MASTER_SLOTS, isFullyBooked: true }
      };

      const result = calculateMaxEndDate('2026-08-24', mockBlocksMap);
      expect(result).toBe('2026-08-28');
    });

    it('should return undefined if there are no upcoming fully booked deadlines', () => {
      const mockBlocksMap: AdminBlocksMap = {
        '2026-08-23': { blockedSlots: MASTER_SLOTS, isFullyBooked: true } // Occurs in the past
      };

      const result = calculateMaxEndDate('2026-08-24', mockBlocksMap);
      expect(result).toBeUndefined();
    });
  });

  describe('getAvailableSlotsForDate', () => {
    beforeEach(() => {
      // 1. Tell Vitest to hijack the global system clock before each test runs
      vi.useFakeTimers();
    });

    afterEach(() => {
      // 2. Restore the authentic local hardware clock execution behavior after each test finishes
      vi.useRealTimers();
    });

    const mockAnchorTime = new Date('2026-08-24T14:30:00.000Z'); // 2:30 PM local wall clock
    vi.setSystemTime(mockAnchorTime);

    it('should filter out passed slots but allow the current ongoing slot when date is today', () => {
      const mockBlocksMap: AdminBlocksMap = {};
      const result = getAvailableSlotsForDate('2026-08-24', mockBlocksMap, standardSlots);

      // Current hour is 14. 
      // [7, 12] should be hidden (already completed)
      // [12, 17] should remain visible (ends at 17, which is > 14)
      // [17, 22] should remain visible (future slot)
      expect(result).not.toContainEqual({ id: "morning", start: 7, end: 12 });
      expect(result).toContainEqual({ id: "afternoon", start: 12, end: 17 });
      expect(result).toContainEqual({ id: "evening", start: 17, end: 22 });
    });

    it('should allow all non-blocked slots for future dates regardless of current time', () => {
      const mockBlocksMap: AdminBlocksMap = {
        '2026-08-25': { blockedSlots: [[7, 12]], isFullyBooked: false }
      };
      
      const result = getAvailableSlotsForDate('2026-08-25', mockBlocksMap, standardSlots);

      expect(result).not.toContainEqual({ id: "morning", start: 7, end: 12 }); // Explicitly blocked by admin profile data
      expect(result).toContainEqual({ id: "afternoon", start: 12, end: 17 });    // Free future slot option
      expect(result).toContainEqual({ id: "evening", start: 17, end: 22 });    // Free future slot option
    });
  });

  describe('getFirstAvailableStartDate', () => {
    it('should loop past fully booked administrative periods cleanly', () => {
      const morningAnchor = new Date('2026-08-24T06:00:00.000Z');
      const mockBlocksMap: AdminBlocksMap = {
        '2026-08-24': { blockedSlots: MASTER_SLOTS, isFullyBooked: true },
        '2026-08-25': { blockedSlots: MASTER_SLOTS, isFullyBooked: true }
        // 2026-08-26 is open
      };

      const result = getFirstAvailableStartDate(mockBlocksMap, morningAnchor);
      expect(result).toBe('2026-08-26');
    });
  });

  describe('addDaysToDateString', () => {
    it('should increment dates safely across calendar month boundaries', () => {
      expect(addDaysToDateString('2026-08-31', 1)).toBe('2026-09-01');
      expect(addDaysToDateString('2026-02-28', 1)).toBe('2026-03-01');
    });

    it('should handle multiday jumps correctly', () => {
      expect(addDaysToDateString('2026-08-24', 3)).toBe('2026-08-27');
    });
  });

  describe('calculatePayloadsForBooking', () => {
    const mockApartmentId = 'apt-123';
    const mockAllSlotsConfig = [
      { start: 7, end: 12 },
      { start: 12, end: 17 },
      { start: 17, end: 22 },
    ];

    it('should generate a single payload for a single day blocking only selected start slots', () => {
      const result = calculatePayloadsForBooking({
        apartmentId: mockApartmentId,
        isMultiDay: false,
        startDate: '2026-08-24',
        endDate: '2026-08-24',
        selectedStartSlots: [{ start: 17, end: 22 }],
        selectedEndSlots: [],
        allSlotsConfig: mockAllSlotsConfig,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        apartmentId: mockApartmentId,
        dateStr: '2026-08-24',
        slotHours: [{ startHour: 17, endHour: 22 }],
        isAdminBlock: true,
      });
    });

    it('should isolate evening slots on day 1 and morning slots on day 2 when crossing overnight ranges', () => {
      const result = calculatePayloadsForBooking({
        apartmentId: mockApartmentId,
        isMultiDay: true,
        startDate: '2026-08-24',
        endDate: '2026-08-25',
        selectedStartSlots: [{ start: 17, end: 22 }], // Day 24 Evening
        selectedEndSlots: [{ start: 7, end: 12 }],   // Day 25 Morning
        allSlotsConfig: mockAllSlotsConfig,
      });

      expect(result).toHaveLength(2);
      
      // Day 1: Bound to selected Evening only
      expect(result[0].dateStr).toBe('2026-08-24');
      expect(result[0].slotHours).toEqual([{ startHour: 17, endHour: 22 }]);
      
      // Day 2: Bound to selected Morning only
      expect(result[1].dateStr).toBe('2026-08-25');
      expect(result[1].slotHours).toEqual([{ startHour: 7, endHour: 12 }]);
    });

    it('should completely block all intermediate days but isolate boundaries on terminal days', () => {
      const result = calculatePayloadsForBooking({
        apartmentId: mockApartmentId,
        isMultiDay: true,
        startDate: '2026-08-24',
        endDate: '2026-08-26',
        selectedStartSlots: [{ start: 17, end: 22 }], // Day 24 Evening
        selectedEndSlots: [{ start: 7, end: 12 }],   // Day 26 Morning
        allSlotsConfig: mockAllSlotsConfig,           // Day 25 gets all template slots
      });

      expect(result).toHaveLength(3);

      // Initial boundary day
      expect(result[0].dateStr).toBe('2026-08-24');
      expect(result[0].slotHours).toEqual([{ startHour: 17, endHour: 22 }]);

      // Full Mid Day (Day 25)
      expect(result[1].dateStr).toBe('2026-08-25');
      expect(result[1].slotHours).toEqual([
        { startHour: 7, endHour: 12 },
        { startHour: 12, endHour: 17 },
        { startHour: 17, endHour: 22 },
      ]);

      // Terminal boundary day
      expect(result[2].dateStr).toBe('2026-08-26');
      expect(result[2].slotHours).toEqual([{ startHour: 7, endHour: 12 }]);
    });
  });
});
