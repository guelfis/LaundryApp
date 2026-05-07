/*
  Migration: Add status and released_at columns to booking table
  Description: This migration adds a status column to track the state of a booking and a released_at column to record when a booking was released.

  Status column:
    - Type: text
    - Default: 'active'
    - Allowed values: 'active', 'released', 'cancelled'
    active means the booking is currently active and valid.
    released means the booking has been released and is no longer active. users can rebook for the remaining time of the booking.
    cancelled means the booking has been cancelled and is no longer active. it will appear as free and if rebooked will be changed to active
*/

ALTER TABLE booking
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' 
CHECK (status IN ('active', 'released', 'cancelled'));

ALTER TABLE booking 
ADD COLUMN IF NOT EXISTS released_at timestamptz;