drop policy "Users can insert bookings for their own apartment" on "public"."booking";

drop policy "Users can manage their own apartment bookings" on "public"."booking";

drop policy "Users can view bookings in the same household" on "public"."booking";


  create policy "Users can insert bookings for their own apartment"
  on "public"."booking"
  as permissive
  for insert
  to authenticated, service_role
with check ((apartment_id IN ( SELECT m.apartment_id
   FROM public.apartment_members m
  WHERE (m.user_id = auth.uid()))));



  create policy "Users can manage their own apartment bookings"
  on "public"."booking"
  as permissive
  for all
  to authenticated, service_role
using ((apartment_id IN ( SELECT m.apartment_id
   FROM public.apartment_members m
  WHERE (m.user_id = auth.uid()))));



  create policy "Users can view bookings in the same household"
  on "public"."booking"
  as permissive
  for select
  to authenticated, service_role
using ((apartment_id IN ( SELECT a.id
   FROM public.apartment a
  WHERE (a.household_id = ( SELECT am_sub.household_id
           FROM (public.apartment_members m_sub
             JOIN public.apartment am_sub ON ((m_sub.apartment_id = am_sub.id)))
          WHERE (m_sub.user_id = auth.uid())
         LIMIT 1)))));



