-- ============================================================
-- Row Level Security. Run after schema.sql.
-- Frontend and mobile clients only ever use the anon/authenticated
-- keys, so these policies are the real authorization boundary.
-- ============================================================

alter table public.profiles enable row level security;
alter table public.barber_profiles enable row level security;
alter table public.business_locations enable row level security;
alter table public.services enable row level security;
alter table public.business_hours enable row level security;
alter table public.barber_images enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.bookings enable row level security;
alter table public.reports enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.owns_barber(target_barber_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.barber_profiles
    where id = target_barber_id and owner_id = auth.uid()
  );
$$;

-- ---------------- profiles ----------------
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- ---------------- barber_profiles ----------------
create policy "barber_profiles_read" on public.barber_profiles
  for select using (status = 'approved' or owner_id = auth.uid() or public.is_admin());

create policy "barber_profiles_insert_own" on public.barber_profiles
  for insert with check (owner_id = auth.uid());

create policy "barber_profiles_update_own_or_admin" on public.barber_profiles
  for update using (owner_id = auth.uid() or public.is_admin());

-- ---------------- business_locations ----------------
create policy "business_locations_read" on public.business_locations
  for select using (
    exists (
      select 1 from public.barber_profiles bp
      where bp.id = business_locations.barber_id
        and (bp.status = 'approved' or bp.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "business_locations_write_own" on public.business_locations
  for all using (public.owns_barber(barber_id) or public.is_admin())
  with check (public.owns_barber(barber_id) or public.is_admin());

-- ---------------- services ----------------
create policy "services_read" on public.services
  for select using (
    exists (
      select 1 from public.barber_profiles bp
      where bp.id = services.barber_id
        and (bp.status = 'approved' or bp.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "services_write_own" on public.services
  for all using (public.owns_barber(barber_id) or public.is_admin())
  with check (public.owns_barber(barber_id) or public.is_admin());

-- ---------------- business_hours ----------------
create policy "business_hours_read" on public.business_hours
  for select using (
    exists (
      select 1 from public.barber_profiles bp
      where bp.id = business_hours.barber_id
        and (bp.status = 'approved' or bp.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "business_hours_write_own" on public.business_hours
  for all using (public.owns_barber(barber_id) or public.is_admin())
  with check (public.owns_barber(barber_id) or public.is_admin());

-- ---------------- barber_images ----------------
create policy "barber_images_read" on public.barber_images
  for select using (
    exists (
      select 1 from public.barber_profiles bp
      where bp.id = barber_images.barber_id
        and (bp.status = 'approved' or bp.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "barber_images_write_own" on public.barber_images
  for all using (public.owns_barber(barber_id) or public.is_admin())
  with check (public.owns_barber(barber_id) or public.is_admin());

-- ---------------- reviews ----------------
create policy "reviews_read" on public.reviews
  for select using (true);

create policy "reviews_insert_own" on public.reviews
  for insert with check (customer_id = auth.uid());

create policy "reviews_update_delete_own" on public.reviews
  for update using (customer_id = auth.uid());

create policy "reviews_delete_own_or_admin" on public.reviews
  for delete using (customer_id = auth.uid() or public.is_admin());

-- ---------------- favorites ----------------
create policy "favorites_all_own" on public.favorites
  for all using (customer_id = auth.uid())
  with check (customer_id = auth.uid());

-- ---------------- bookings ----------------
create policy "bookings_read_own_side" on public.bookings
  for select using (
    customer_id = auth.uid() or public.owns_barber(barber_id) or public.is_admin()
  );

create policy "bookings_insert_own" on public.bookings
  for insert with check (customer_id = auth.uid());

create policy "bookings_update_own_side" on public.bookings
  for update using (
    customer_id = auth.uid() or public.owns_barber(barber_id) or public.is_admin()
  );

-- ---------------- reports ----------------
create policy "reports_insert_own" on public.reports
  for insert with check (reporter_id = auth.uid());

create policy "reports_read_admin_or_reporter" on public.reports
  for select using (reporter_id = auth.uid() or public.is_admin());

create policy "reports_update_admin" on public.reports
  for update using (public.is_admin());

-- ---------------- storage ----------------
create policy "barber_logos_public_read" on storage.objects
  for select using (bucket_id = 'barber-logos');

create policy "barber_logos_owner_write" on storage.objects
  for insert with check (bucket_id = 'barber-logos' and auth.role() = 'authenticated');

create policy "barber_photos_public_read" on storage.objects
  for select using (bucket_id = 'barber-photos');

create policy "barber_photos_owner_write" on storage.objects
  for insert with check (bucket_id = 'barber-photos' and auth.role() = 'authenticated');

-- ---------------- conversations & messages ----------------
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "conversations_participants_read" on public.conversations
  for select using (customer_id = auth.uid() or public.owns_barber(barber_id) or public.is_admin());

create policy "conversations_customer_create" on public.conversations
  for insert with check (customer_id = auth.uid());

create policy "messages_participants_read" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.customer_id = auth.uid() or public.owns_barber(c.barber_id) or public.is_admin())
    )
  );

create policy "messages_participants_send" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.customer_id = auth.uid() or public.owns_barber(c.barber_id))
    )
  );
