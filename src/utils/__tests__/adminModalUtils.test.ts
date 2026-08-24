import { describe, it, expect } from 'vitest';
import { 
  processAdminBlocks, 
  calculateMaxEndDate, 
  getAvailableSlotsForDate, 
  getFirstAvailableStartDate,
  AdminBlocksMap
} from '../adminModalUtils';
import { Booking } from '../../lib/databaseTypes';

describe('Admin Booking Utility Suite', () => {
  const ADMIN_ID = 'admin-uuid-123';
  
  // Custom master slots matching your layout boundaries
  const MASTER_SLOTS = [[7, 12], [12, 17], [17, 22]]; 

  // Factory helper to quickly build full valid Booking objects for testing assertions
  const createMockBooking = (fields: Partial<Booking>): Booking => ({
    id: 'mock-id-' + Math.random(),
    apartment_id: null,
    created_at: new Date().toISOString(),
    created_by: null,
    start_time: '',
    end_time: '',
    notes: null,
    released_at: null,
    status: 'admin',
    ...fields
  });

  describe('processAdminBlocks', () => {
    it('should correctly map admin bookings and identify fully booked days', () => {
      const mockBookings: Booking[] = [
        createMockBooking({ start_time: '2026-08-24T07:00:00Z', end_time: '2026-08-24T12:00:00Z', apartment_id: ADMIN_ID }),
        createMockBooking({ start_time: '2026-08-24T12:00:00Z', end_time: '2026-08-24T17:00:00Z', apartment_id: ADMIN_ID }),
        createMockBooking({ start_time: '2026-08-24T17:00:00Z', end_time: '2026-08-24T22:00:00Z', apartment_id: ADMIN_ID }),
        createMockBooking({ start_time: '2026-08-25T07:00:00Z', end_time: '2026-08-25T12:00:00Z', apartment_id: ADMIN_ID }), // Partial block
      ];

      const result = processAdminBlocks(mockBookings, MASTER_SLOTS, new Date('2026-08-24T14:30:00Z'));

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
    const mockAnchorTime = new Date('2026-08-24T14:30:00.000Z'); // 2:30 PM local wall clock

    it('should filter out passed slots but allow the current ongoing slot when date is today', () => {
      const mockBlocksMap: AdminBlocksMap = {};
      const result = getAvailableSlotsForDate('2026-08-24', mockBlocksMap, MASTER_SLOTS, mockAnchorTime);

      // Current hour is 14. 
      // [7, 12] should be hidden (already completed)
      // [12, 17] should remain visible (ends at 17, which is > 14)
      // [17, 22] should remain visible (future slot)
      expect(result).not.toContainEqual([7, 12]);
      expect(result).toContainEqual([12, 17]);
      expect(result).toContainEqual([17, 22]);
    });

    it('should allow all non-blocked slots for future dates regardless of current time', () => {
      const mockBlocksMap: AdminBlocksMap = {
        '2026-08-25': { blockedSlots: [[7, 12]], isFullyBooked: false }
      };
      
      const result = getAvailableSlotsForDate('2026-08-25', mockBlocksMap, MASTER_SLOTS, mockAnchorTime);

      expect(result).not.toContainEqual([7, 12]); // Explicitly blocked by admin profile data
      expect(result).toContainEqual([12, 17]);    // Free future slot option
      expect(result).toContainEqual([17, 22]);    // Free future slot option
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
});