drop extension if exists "pg_net";

drop policy "Authenticated users can read apartments" on "public"."apartment";

drop policy "Authenticated users can read bookings" on "public"."booking";

drop policy "Authenticated users can read households" on "public"."household";


  create policy "Authenticated users can read apartments"
  on "public"."apartment"
  as permissive
  for select
  to authenticated, anon
using (true);



  create policy "Authenticated users can read bookings"
  on "public"."booking"
  as permissive
  for select
  to authenticated, anon
using (true);



  create policy "Authenticated users can read households"
  on "public"."household"
  as permissive
  for select
  to authenticated, anon
using (true);



