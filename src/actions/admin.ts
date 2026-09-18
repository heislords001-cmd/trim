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
    .select("id, business_name, slug, status, is_verified, created_at, business_locations(city)")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data } = await query;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    business_name: row.business_name,
    slug: row.slug,
    status: row.status,
    is_verified: row.is_verified,
    created_at: row.created_at,
    city: row.business_locations?.[0]?.city ?? null
  }));
}
