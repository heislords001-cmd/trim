import { createClient } from "@/lib/supabase/server";

export interface AdminOverview {
  totalBarbers: number;
  pendingBarbers: number;
  approvedBarbers: number;
  suspendedBarbers: number;
  totalCustomers: number;
}

// Access is already gated by middleware.ts (role must be 'admin') and by
// RLS (is_admin() is required for these rows to even be visible), so this
// is safe to call straight from a Server Component.
export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = createClient();

  const [{ count: total }, { count: pending }, { count: approved }, { count: suspended }, { count: customers }] =
    await Promise.all([
      supabase.from("barber_profiles").select("id", { count: "exact", head: true }),
      supabase.from("barber_profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("barber_profiles").select("id", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("barber_profiles").select("id", { count: "exact", head: true }).eq("status", "suspended"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer")
    ]);

  return {
    totalBarbers: total ?? 0,
    pendingBarbers: pending ?? 0,
    approvedBarbers: approved ?? 0,
    suspendedBarbers: suspended ?? 0,
    totalCustomers: customers ?? 0
  };
}

export interface AdminBarberRow {
  id: string;
  business_name: string;
  slug: string;
  status: string;
  is_verified: boolean;
  created_at: string;
  city: string | null;
}

export async function listBarbersForAdmin(status?: string): Promise<AdminBarberRow[]> {
  const supabase = createClient();
  let query = supabase
    .from("barber_profiles")
    .select("id, business_name, slug, status, is_verified, created_at")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data: barbers } = await query;
  if (!barbers || barbers.length === 0) return [];

  // Plain query + in-memory join instead of an embedded
  // `business_locations(city)` select — see the comment in
  // actions/chat.ts for why, with a hand-written Database type.
  const { data: locations } = await supabase
    .from("business_locations")
    .select("barber_id, city")
    .in(
      "barber_id",
      barbers.map((b) => b.id)
    );
  const cityByBarber = new Map((locations ?? []).map((l) => [l.barber_id, l.city]));

  return barbers.map((b) => ({
    id: b.id,
    business_name: b.business_name,
    slug: b.slug,
    status: b.status,
    is_verified: b.is_verified,
    created_at: b.created_at,
    city: cityByBarber.get(b.id) ?? null
  }));
}
