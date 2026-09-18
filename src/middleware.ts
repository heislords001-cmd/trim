import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createClient } from "@supabase/supabase-js";

// Protects /dashboard (barber-only) and /admin (admin-only).
// This is the real gate — RLS is the backstop if anything slips past it.
export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  const needsBarber = path.startsWith("/dashboard");
  const needsAdmin = path.startsWith("/admin");

  if (!needsBarber && !needsAdmin) return response;

  if (!user) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(loginUrl);
  }

  // Service-role client purely to read this one row for the role check —
  // never exposed to the browser, only used inside middleware.
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (needsAdmin && profile?.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (needsBarber && profile?.role !== "barber" && profile?.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"]
};
