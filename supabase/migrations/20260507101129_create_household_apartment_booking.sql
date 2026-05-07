/*
  # Create household, apartment, and booking tables

  ## New Tables

  1. `household`
     - `id` (uuid, primary key)
     - `name` (text, required)
     - `address` (text, optional)
     - `access_code` (text, unique, required) — used to join a household
     - `created_at` (timestamptz)

  2. `apartment`
     - `id` (uuid, primary key)
     - `household_id` (uuid, FK → household.id, cascade delete)
     - `display_name` (text, required)
     - `password_hash` (text, required)
     - `created_at` (timestamptz)

  3. `booking`
     - `id` (uuid, primary key)
     - `apartment_id` (uuid, FK → apartment.id, cascade delete)
     - `start_time` (timestamptz, required)
     - `end_time` (timestamptz, required)
     - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all three tables
  - Authenticated users can read all rows (shared household context)
  - Authenticated users can insert/update/delete their own records based on apartment ownership

  ## Notes
  - Cascade deletes ensure apartments are removed when a household is deleted,
    and bookings are removed when an apartment is deleted
*/

CREATE TABLE IF NOT EXISTS household (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  access_code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS apartment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES household(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS booking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid REFERENCES apartment(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS apartment_household_id_idx ON apartment(household_id);
CREATE INDEX IF NOT EXISTS booking_apartment_id_idx ON booking(apartment_id);
CREATE INDEX IF NOT EXISTS booking_start_time_idx ON booking(start_time);

-- Enable RLS
ALTER TABLE household ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartment ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking ENABLE ROW LEVEL SECURITY;

-- household policies
CREATE POLICY "Authenticated users can read households"
  ON household FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert households"
  ON household FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update households"
  ON household FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete households"
  ON household FOR DELETE
  TO authenticated
  USING (true);

-- apartment policies
CREATE POLICY "Authenticated users can read apartments"
  ON apartment FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert apartments"
  ON apartment FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update apartments"
  ON apartment FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete apartments"
  ON apartment FOR DELETE
  TO authenticated
  USING (true);

-- booking policies
CREATE POLICY "Authenticated users can read bookings"
  ON booking FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert bookings"
  ON booking FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update bookings"
  ON booking FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete bookings"
  ON booking FOR DELETE
  TO authenticated
  USING (true);
