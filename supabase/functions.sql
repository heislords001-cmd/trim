-- ============================================================
-- Geographic search RPC.
-- Called from the frontend as:
--   supabase.rpc('nearby_barbers', { search_lat, search_lng, radius_km, max_results })
-- Does the distance math in Postgres/PostGIS so it scales to
-- thousands of barbers instead of pulling every row to the client.
-- ============================================================

create or replace function public.nearby_barbers(
  search_lat double precision,
  search_lng double precision,
  radius_km double precision default 5,
  max_results integer default 50
)
returns table (
  barber_id uuid,
  business_name text,
  slug text,
  logo_url text,
  rating_average numeric,
  rating_count integer,
  is_verified boolean,
  address text,
  city text,
  distance_meters double precision,
  starting_price numeric
)
language sql
stable
as $$
  select
    bp.id as barber_id,
    bp.business_name,
    bp.slug,
    bp.logo_url,
    bp.rating_average,
    bp.rating_count,
    bp.is_verified,
    bl.address,
    bl.city,
    st_distance(bl.geog, st_setsrid(st_makepoint(search_lng, search_lat), 4326)::geography) as distance_meters,
    (select min(s.price_naira) from public.services s where s.barber_id = bp.id) as starting_price
  from public.barber_profiles bp
  join public.business_locations bl on bl.barber_id = bp.id
  where bp.status = 'approved'
    and st_dwithin(
      bl.geog,
      st_setsrid(st_makepoint(search_lng, search_lat), 4326)::geography,
      radius_km * 1000
    )
  order by distance_meters asc
  limit max_results;
$$;

grant execute on function public.nearby_barbers to anon, authenticated;

-- ============================================================
-- Location upsert. Takes plain lat/lng from the UI (map picker or
-- geolocation) and builds the PostGIS geography server-side, so the
-- frontend never has to construct WKT/GeoJSON by hand.
-- security invoker + the owns_barber() check inside means this can
-- only ever touch a location the caller's own barber_profiles row owns
-- (policies.sql's business_locations_write_own policy enforces the
-- same rule again at the table level as a second layer).
-- ============================================================

create or replace function public.upsert_business_location(
  p_barber_id uuid,
  p_address text,
  p_city text,
  p_state_region text,
  p_country text,
  p_lat double precision,
  p_lng double precision
)
returns public.business_locations
language plpgsql
security invoker
as $$
declare
  result public.business_locations;
begin
  if not public.owns_barber(p_barber_id) and not public.is_admin() then
    raise exception 'not authorized to edit this barber''s location';
  end if;

  insert into public.business_locations (barber_id, address, city, state_region, country, geog)
  values (
    p_barber_id, p_address, p_city, p_state_region, p_country,
    st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
  )
  on conflict (barber_id) do update
    set address = excluded.address,
        city = excluded.city,
        state_region = excluded.state_region,
        country = excluded.country,
        geog = excluded.geog,
        updated_at = now()
  returning * into result;

  return result;
end;
$$;

grant execute on function public.upsert_business_location to authenticated;

-- ============================================================
-- Nearby *unclaimed* listings, same shape/logic as nearby_barbers() so
-- the frontend can call both and merge them into one result set.
-- ============================================================

create or replace function public.nearby_external_listings(
  search_lat double precision,
  search_lng double precision,
  radius_km double precision default 5,
  max_results integer default 50
)
returns table (
  listing_id uuid,
  name text,
  address text,
  city text,
  distance_meters double precision,
  lat double precision,
  lng double precision
)
language sql
stable
as $$
  select
    el.id as listing_id,
    el.name,
    el.address,
    el.city,
    st_distance(el.geog, st_setsrid(st_makepoint(search_lng, search_lat), 4326)::geography) as distance_meters,
    st_y(el.geog::geometry) as lat,
    st_x(el.geog::geometry) as lng
  from public.external_listings el
  where el.claimed_by_barber_id is null
    and st_dwithin(
      el.geog,
      st_setsrid(st_makepoint(search_lng, search_lat), 4326)::geography,
      radius_km * 1000
    )
  order by distance_meters asc
  limit max_results;
$$;

grant execute on function public.nearby_external_listings to anon, authenticated;
