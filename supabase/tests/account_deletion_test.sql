BEGIN;
-- Increase the plan count to cover all 8 distinct business rule assertions
SELECT plan(8);

CREATE EXTENSION IF NOT EXISTS pgtap;

-- =========================================================================
-- SYSTEM PRE-TEST SEED DATA
-- =========================================================================

-- Create Core Auth Users
INSERT INTO auth.users (id, email, encrypted_password, role, aud)
VALUES ('11111111-1111-1111-1111-111111111111', 'main-test@example.com', 'hash', 'authenticated', 'authenticated'),
       ('22222222-2222-2222-2222-222222222222', 'roommate-1@example.com', 'hash', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Create Public Profiles
INSERT INTO public.profiles (id, full_name) 
VALUES ('11111111-1111-1111-1111-111111111111', 'Main Test User'),
       ('22222222-2222-2222-2222-222222222222', 'Roommate User')
ON CONFLICT (id) DO NOTHING;

-- Clean pre-existing test layouts
DELETE FROM public.memberships WHERE household_id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'dddddddd-dddd-dddd-dddd-dddddddddddd'
);

-- SCENARIO A: Shared House A (User is a standard building & apartment member)
INSERT INTO public.household (id, name, access_code) 
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Shared House A', 'CODE-AAA') ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apartment (id, household_id, display_name)
VALUES ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Shared Room 101') ON CONFLICT (id) DO NOTHING;

INSERT INTO public.memberships (household_id, apartment_id, user_id, household_role, apartment_role)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '11111111-1111-1111-1111-111111111111', 'member'::household_role, 'member'::apartment_role),
       ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '22222222-2222-2222-2222-222222222222', 'admin'::household_role, 'admin'::apartment_role)
ON CONFLICT DO NOTHING;

-- SCENARIO B: Lone House B (User lives completely alone -> Auto-deletes whole environment)
INSERT INTO public.household (id, name, access_code) 
VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Lone House B', 'CODE-BBB') ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apartment (id, household_id, display_name)
VALUES ('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Suite 1') ON CONFLICT (id) DO NOTHING;

INSERT INTO public.memberships (household_id, apartment_id, user_id, household_role, apartment_role)
VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', '11111111-1111-1111-1111-111111111111', 'admin'::household_role, 'admin'::apartment_role)
ON CONFLICT DO NOTHING;

-- SCENARIO C: Shared House D with a Lone Apartment (User is the last person in Apt 2, but House has other roommates)
INSERT INTO public.household (id, name, access_code) 
VALUES ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Shared House D', 'CODE-DDD') ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apartment (id, household_id, display_name)
VALUES ('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Apt 1 (Roommates Room)'),
       ('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Apt 2 (User Lone Room)')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.memberships (household_id, apartment_id, user_id, household_role, apartment_role)
VALUES ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'd1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', '22222222-2222-2222-2222-222222222222', 'admin'::household_role, 'admin'::apartment_role),
       ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', '11111111-1111-1111-1111-111111111111', 'member'::household_role, 'admin'::apartment_role)
ON CONFLICT DO NOTHING;


-- =========================================================================
-- RUN SELECTION A, B, AND C EXECUTIONS (SUCCESS PATHS)
-- =========================================================================

-- Inject current logged-in test user token session parameters
SELECT set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111"}', true);

-- Fire the automated purging procedure
SELECT public.automated_self_deletion_process();

-- TEST 1: Case 1 Validation (Shared House A must survive)
SELECT is(
    (SELECT COUNT(*)::INT FROM public.household WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    1,
    'Shared house must NOT be touched when a standard member deletes their account'
);

-- TEST 2: Case 1 Validation (Shared Apartment 101 must survive)
SELECT is(
    (SELECT COUNT(*)::INT FROM public.apartment WHERE id = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'),
    1,
    'Shared apartments must NOT be touched when a standard member deletes their account'
);

-- TEST 3: Case 3 Validation (Lone House B must be completely destroyed)
SELECT is(
    (SELECT COUNT(*)::INT FROM public.household WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    0,
    'Lone buildings must be completely dismantled from the server automatically'
);

-- TEST 4: Case 3 Validation (Lone Apartment Suite 1 must be wiped)
SELECT is(
    (SELECT COUNT(*)::INT FROM public.apartment WHERE id = 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1'),
    0,
    'Lone apartments must cascade drop instantly along with their parent household'
);

-- TEST 5: Case 2 Validation (Lone Apartment 2 inside Shared House D must drop)
SELECT is(
    (SELECT COUNT(*)::INT FROM public.apartment WHERE id = 'd2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2'),
    0,
    'Lone apartments inside surviving shared buildings must be deleted automatically'
);

-- TEST 6: Case 2 Validation (Shared House D must survive because of the roommate)
SELECT is(
    (SELECT COUNT(*)::INT FROM public.household WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
    1,
    'Shared buildings must survive if a lone resident only deletes their sub-apartment'
);


-- =========================================================================
-- RUN EXCEPTION ERRORS VALIDATION (FAILING BLOCKS PATHS)
-- =========================================================================

-- Re-seed profile row for error tracking tracks
INSERT INTO auth.users (id, email, role, aud) VALUES ('11111111-1111-1111-1111-111111111111', 'main-test@example.com', 'authenticated', 'authenticated') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id, full_name) VALUES ('11111111-1111-1111-1111-111111111111', 'Main Test User') ON CONFLICT DO NOTHING;

-- SCENARIO D: Sole Building Admin Block Check (House E)
DELETE FROM public.memberships WHERE household_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
INSERT INTO public.household (id, name, access_code) VALUES ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Admin House E', 'CODE-EEE') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.memberships (household_id, user_id, household_role)
VALUES ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'admin'::household_role),
       ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'member'::household_role);

SELECT set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111"}', true);

-- TEST 7: Expect SOLE_BUILDING_ADMIN_ERROR
SELECT throws_ok(
    'SELECT public.automated_self_deletion_process()',
    'SOLE_BUILDING_ADMIN_ERROR',
    'Should throw SOLE_BUILDING_ADMIN_ERROR if the user is the only admin of a shared building'
);

-- SCENARIO E: Sole Apartment Admin Block Check (Apt 3 in Shared House F)
DELETE FROM public.memberships WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- Now seed House F cleanly
DELETE FROM public.memberships WHERE household_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
INSERT INTO public.household (id, name, access_code) VALUES ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Shared House F', 'CODE-FFF') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.apartment (id, household_id, display_name) VALUES ('f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Shared Apt 3') ON CONFLICT (id) DO NOTHING;

INSERT INTO public.memberships (household_id, apartment_id, user_id, household_role, apartment_role)
VALUES 
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3', '11111111-1111-1111-1111-111111111111', 'member'::household_role, 'admin'::apartment_role),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3', '22222222-2222-2222-2222-222222222222', 'admin'::household_role, 'member'::apartment_role)
ON CONFLICT DO NOTHING;



-- TEST 8: Expect SOLE_APARTMENT_ADMIN_ERROR
SELECT throws_ok(
    'SELECT public.automated_self_deletion_process()',
    'SOLE_APARTMENT_ADMIN_ERROR',
    'Should throw SOLE_APARTMENT_ADMIN_ERROR if the user is the only admin of a shared apartment'
);

SELECT * FROM finish();
ROLLBACK;
