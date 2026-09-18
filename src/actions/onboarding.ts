"use server";

import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils/format";
import { revalidatePath } from "next/cache";

export interface ActionResult<T = undefined> {
  ok: boolean;
  error?: string;
  data?: T;
}

// STEP 1 — account. Creates the auth user with role: "barber" in its
// metadata so the handle_new_user() trigger writes profiles.role = 'barber'.
export async function createBarberAccount(input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}): Promise<ActionResult<{ userId: string }>> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { role: "barber", full_name: input.fullName, phone: input.phone } }
  });
  if (error || !data.user) return { ok: false, error: error?.message ?? "Sign up failed" };
  return { ok: true, data: { userId: data.user.id } };
}

// STEP 2 — business info. Generates a unique slug, retrying with a
// short random suffix on collision rather than failing the whole step.
export async function createBarberProfile(input: {
  ownerId: string;
  businessName: string;
  description: string;
  businessPhone: string;
  whatsappNumber: string;
  logoUrl: string | null;
}): Promise<ActionResult<{ barberId: string; slug: string }>> {
  const supabase = createClient();
  const baseSlug = slugify(input.businessName);

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase
      .from("barber_profiles")
      .insert({
        owner_id: input.ownerId,
        business_name: input.businessName,
        slug,
        description: input.description,
        business_phone: input.businessPhone,
        whatsapp_number: input.whatsappNumber,
        logo_url: input.logoUrl,
        status: "pending"
      })
      .select("id, slug")
      .single();

    if (!error && data) return { ok: true, data: { barberId: data.id, slug: data.slug } };
    if (error && error.code !== "23505") return { ok: false, error: error.message }; // not a unique-violation, stop
  }
  return { ok: false, error: "Could not generate a unique URL for this business name." };
}

// STEP 3 — location. Delegates the geography construction to Postgres
// via upsert_business_location() (see supabase/functions.sql).
export async function saveBarberLocation(input: {
  barberId: string;
  address: string;
  city: string;
  stateRegion: string;
  country: string;
  lat: number;
  lng: number;
}): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.rpc("upsert_business_location", {
    p_barber_id: input.barberId,
    p_address: input.address,
    p_city: input.city,
    p_state_region: input.stateRegion || null,
    p_country: input.country,
    p_lat: input.lat,
    p_lng: input.lng
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// STEP 4 — services. Replaces the barber's full service list each call,
// which keeps the onboarding form (and the dashboard edit screen that
// reuses this action) simple: it's always "save what's on screen now".
export async function saveBarberServices(
  barberId: string,
  services: { name: string; priceNaira: number; durationMinutes: number | null }[]
): Promise<ActionResult> {
  const supabase = createClient();
  const { error: deleteError } = await supabase.from("services").delete().eq("barber_id", barberId);
  if (deleteError) return { ok: false, error: deleteError.message };

  if (services.length === 0) return { ok: true };

  const { error } = await supabase.from("services").insert(
    services.map((s, index) => ({
      barber_id: barberId,
      name: s.name,
      price_naira: s.priceNaira,
      duration_minutes: s.durationMinutes,
      sort_order: index
    }))
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// STEP 5 — opening hours, one row per day of week.
export async function saveBarberHours(
  barberId: string,
  hours: { dayOfWeek: number; isOpen: boolean; openTime: string | null; closeTime: string | null }[]
): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from("business_hours").upsert(
    hours.map((h) => ({
      barber_id: barberId,
      day_of_week: h.dayOfWeek,
      is_open: h.isOpen,
      open_time: h.isOpen ? h.openTime : null,
      close_time: h.isOpen ? h.closeTime : null
    })),
    { onConflict: "barber_id,day_of_week" }
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// STEP 6 — photos. Upload happens client-side straight to Supabase
// Storage (see components/onboarding/StepPhotos.tsx); this just records
// the resulting public URLs against the barber.
export async function saveBarberImages(
  barberId: string,
  images: { url: string; type: "shop" | "work" | "logo" }[]
): Promise<ActionResult> {
  const supabase = createClient();
  if (images.length === 0) return { ok: true };
  const { error } = await supabase.from("barber_images").insert(
    images.map((img, index) => ({
      barber_id: barberId,
      image_url: img.url,
      image_type: img.type,
      sort_order: index
    }))
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// STEP 7 — nothing to write; status is already 'pending' from step 2.
// This just confirms submission and refreshes the dashboard route.
export async function finishOnboarding(): Promise<ActionResult> {
  revalidatePath("/dashboard");
  return { ok: true };
}

// ---------------- admin actions ----------------
export async function setBarberStatus(
  barberId: string,
  status: "approved" | "rejected" | "suspended"
): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from("barber_profiles").update({ status }).eq("id", barberId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}
