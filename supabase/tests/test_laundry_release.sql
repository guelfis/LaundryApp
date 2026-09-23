BEGIN;

-- Plan for 5 distinct assertion checks covering all logical paths
SELECT plan(5);

CREATE EXTENSION IF NOT EXISTS pgtap;

-- =========================================================================
-- SYSTEM SEED DATA SETUP
-- =========================================================================

-- Create Core Auth User
INSERT INTO auth.users (id, email, encrypted_password, role, aud)
VALUES ('99999999-9999-9999-9999-999999999999', 'laundry-test@example.com', 'hash', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name) 
VALUES ('99999999-9999-9999-9999-999999999999', 'Laundry Tester')
ON CONFLICT (id) DO NOTHING;

-- Clean out isolated tables to ensure clean slate constraints
DELETE FROM public.memberships WHERE household_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
DELETE FROM public.booking WHERE apartment_id = 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1';
DELETE FROM public.apartment WHERE id = 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1';
DELETE FROM public.household WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Setup core layouts
INSERT INTO public.household (id, name, access_code, timezone) 
VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Test Laundry House', 'CODE-LAUNDRY', 'Europe/Zurich') 
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apartment (id, household_id, display_name)
VALUES ('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Lab Room 404') 
ON CONFLICT (id) DO NOTHING;

-- This membership satisfies the assert_apartment_membership(apartment_id, user_id) function
INSERT INTO public.memberships (household_id, apartment_id, user_id, household_role, apartment_role)
VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', '99999999-9999-9999-9999-999999999999', 'member'::household_role, 'member'::apartment_role)
ON CONFLICT DO NOTHING;

-- Simulate active Supabase user context session token
SELECT set_config('request.jwt.claims', '{"sub": "99999999-9999-9999-9999-999999999999"}', true);


-- =========================================================================
-- SEED SPECIFIC SYSTEM TEST SCENARIOS (Bypassing function ambiguity completely)
-- =========================================================================

-- Scenario A: A future slot (Targeting year 2030)
INSERT INTO public.booking (id, apartment_id, created_by, start_time, end_time, status, notes)
VALUES (
    'a5555555-5555-5555-5555-555555555555'::UUID,
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1'::UUID,
    '99999999-9999-9999-9999-999999999999'::UUID,
    '2030-10-15 10:00:00+02'::TIMESTAMP WITH TIME ZONE,
    '2030-10-15 12:00:00+02'::TIMESTAMP WITH TIME ZONE,
    'active'::public.booking_status,
    'Future test run slot'::TEXT
);

-- Scenario B: An ongoing slot (Spanning 'now()')
INSERT INTO public.booking (id, apartment_id, created_by, start_time, end_time, status, notes)
VALUES (
    '88888888-8888-8888-8888-888888888888'::UUID,
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1'::UUID,
    '99999999-9999-9999-9999-999999999999'::UUID,
    now() - '30 minutes'::interval,
    now() + '30 minutes'::interval,
    'active'::public.booking_status,
    'Ongoing test run slot'::TEXT
);

-- Scenario C: An expired historical slot completely in the past
INSERT INTO public.booking (id, apartment_id, created_by, start_time, end_time, status, notes)
VALUES (
    '77777777-7777-7777-7777-777777777777'::UUID,
    'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1'::UUID,
    '99999999-9999-9999-9999-999999999999'::UUID,
    now() - '2 hours'::interval,
    now() - '1 hour'::interval,
    'active'::public.booking_status,
    'Expired historical slot'::TEXT
);


-- =========================================================================
-- EXECUTE SEQUENTIAL pgTAP TESTS
-- =========================================================================

-- TEST 1: Scenario A - Future appointments must return deleted payload confirmation
SELECT is(
    public.release_laundry_slot('a5555555-5555-5555-5555-555555555555'::UUID),
    jsonb_build_object('action', 'deleted', 'message', 'Booking cancelled successfully.'),
    'Should completely wipe future slots and return a deleted confirmation payload'
);

-- TEST 2: Verify database hard-deletion of future appointment
SELECT is(
    (SELECT COUNT(*)::INT FROM public.booking WHERE id = 'a5555555-5555-5555-5555-555555555555'::UUID),
    0,
    'Database verification: The future booking row should be completely removed from disk'
);

-- TEST 3: Scenario B - Ongoing appointments must return shortened payload confirmation
SELECT is(
    public.release_laundry_slot('88888888-8888-8888-8888-888888888888'::UUID),
    jsonb_build_object('action', 'shortened', 'message', 'Slot released early! The remaining time block is now free.'),
    'Should truncate ongoing slots and return shortened notification JSON'
);

-- TEST 4: Verify state tracking updates on shortened appointments
SELECT is(
    (SELECT status::TEXT FROM public.booking WHERE id = '88888888-8888-8888-8888-888888888888'::UUID),
    'released'::TEXT,
    'Database verification: Ongoing booking status flag must change to released'
);

-- TEST 5: Assert expired historical execution blocks updates and throws exception
SELECT throws_ok(
    $$ SELECT public.release_laundry_slot('77777777-7777-7777-7777-777777777777'::UUID) $$,
    'Cannot release a booking that has already expired.',
    'Should raise error if user attempts to modify an old expired laundry timeframe'
);

-- Complete execution teardown
SELECT * FROM finish();
ROLLBACK;
