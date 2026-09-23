BEGIN;

-- Expand the plan to cover 5 distinct business logic assertions
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

-- Clean pre-existing references for isolation
DELETE FROM public.memberships WHERE household_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
DELETE FROM public.apartment WHERE id = 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1';
DELETE FROM public.household WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Create Household and Apartment with explicit types
INSERT INTO public.household (id, name, access_code, timezone) 
VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Test Laundry House', 'CODE-LAUNDRY', 'Europe/Zurich') 
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apartment (id, household_id, display_name)
VALUES ('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Lab Room 404') 
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.memberships (household_id, apartment_id, user_id, household_role, apartment_role)
VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', '99999999-9999-9999-9999-999999999999', 'member'::household_role, 'member'::apartment_role)
ON CONFLICT DO NOTHING;


-- =========================================================================
-- SUPABASE AUTHENTICATION CONTEXT MOCK
-- =========================================================================
SELECT set_config('request.jwt.claims', '{"sub": "99999999-9999-9999-9999-999999999999"}', true);


-- =========================================================================
-- EXECUTE NOTES & STATUS PARAMETER TESTS (6-Argument Signature Overload)
-- =========================================================================

-- TEST 1: Verify 'notes' and 'status' insert correctly into the table
SELECT lives_ok(
    $$ 
        SELECT public.book_laundry_slot(
            'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1'::UUID, 
            '2026-10-15'::DATE, 
            10::INT, 
            12::INT, 
            'Extra dirty sports kit'::TEXT,   -- notes
            'active'::TEXT                    -- requested_status
        );
    $$,
    'Should accept 6 parameters and process notes and status fields successfully'
);

-- TEST 2: Assert data integrity (Confirm fields were saved exactly as passed)
SELECT is(
    (SELECT notes::TEXT FROM public.booking WHERE apartment_id = 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1'::UUID LIMIT 1),
    'Extra dirty sports kit'::TEXT,
    'The inserted booking record must store the notes payload accurately'
);

-- TEST 3: Validate text casting conversion to enum type
SELECT is(
    (SELECT status::TEXT FROM public.booking WHERE apartment_id = 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1'::UUID LIMIT 1),
    'active'::TEXT,
    'The requested string status should map correctly to the internal schema enum type value'
);

-- TEST 4: Malicious or unapproved status restriction validation
SELECT throws_ok(
    $$ 
        SELECT public.book_laundry_slot(
            'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1'::UUID, 
            '2026-10-15'::DATE, 
            14::INT, 
            16::INT, 
            'Bypass attempt'::TEXT, 
            'super_admin_hack'::TEXT  -- malicious value to be thrown
        );
    $$,
    'Invalid Status: Must be either active or admin.',
    'Should throw validation error if status falls outside defined applications ranges'
);

-- TEST 5: Assert execution workflow under alternate approved status ('admin')
SELECT lives_ok(
    $$ 
        SELECT public.book_laundry_slot(
            'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1'::UUID, 
            '2026-10-15'::DATE, 
            18::INT, 
            20::INT, 
            'Maintenance Blockout'::TEXT, 
            'admin'::TEXT -- Testing the second allowed enum path
        );
    $$,
    'Should allow booking execution when utilizing the "admin" status payload'
);

-- Complete execution block
SELECT * FROM finish();
ROLLBACK;
