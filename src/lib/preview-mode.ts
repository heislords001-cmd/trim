/**
 * TEMPORARY: lets you browse /dashboard and /admin without a real
 * Supabase project set up yet, by falling back to sample data instead
 * of redirecting to login.
 *
 * Flip this to `false` (or delete this file and the fallbacks that
 * reference it) once you've actually run the SQL and have real
 * accounts to sign in with — this should never ship to production
 * flipped on, since it also disables the /dashboard and /admin route
 * guards in middleware.ts.
 */
export const PREVIEW_MODE = true;

export const SAMPLE_BARBER = {
  id: "sample-barber-id",
  business_name: "Fade City Barbers",
  slug: "fade-city-barbers",
  description:
    "Modern barbershop specializing in skin fades and beard sculpting. Walk-ins welcome, appointments recommended on weekends.",
  business_phone: "+234 800 000 0000",
  whatsapp_number: "+234 800 000 0000",
  logo_url: null,
  is_verified: true,
  rating_average: 4.8,
  rating_count: 214,
  status: "approved" as const,
  location: { address: "12 Clipper Lane", city: "Wuse II, Abuja", state_region: "FCT", country: "Nigeria", lat: 9.0765, lng: 7.3986 },
  services: [
    { id: "s1", name: "Haircut", price_naira: 3000, duration_minutes: 30 },
    { id: "s2", name: "Skin Fade", price_naira: 4000, duration_minutes: 40 },
    { id: "s3", name: "Beard Trim", price_naira: 1500, duration_minutes: 15 }
  ],
  hours: [1, 2, 3, 4, 5, 6].map((day) => ({ day_of_week: day, is_open: true, open_time: "09:00", close_time: "20:00" })),
  images: [] as { id: string; image_url: string; image_type: string }[]
};

export const SAMPLE_ADMIN_OVERVIEW = {
  totalBarbers: 12,
  pendingBarbers: 3,
  approvedBarbers: 8,
  suspendedBarbers: 1,
  totalCustomers: 47
};

export const SAMPLE_ADMIN_BARBERS = [
  { id: "b1", business_name: "Fade City Barbers", slug: "fade-city-barbers", status: "approved", is_verified: true, created_at: new Date().toISOString(), city: "Wuse II, Abuja" },
  { id: "b2", business_name: "Capital Cuts Studio", slug: "capital-cuts-studio", status: "approved", is_verified: true, created_at: new Date().toISOString(), city: "Garki, Abuja" },
  { id: "b3", business_name: "Kush's Barber Shop", slug: "kushs-barber-shop", status: "pending", is_verified: false, created_at: new Date().toISOString(), city: "Maitama, Abuja" }
];

export const SAMPLE_CONVERSATIONS = [
  { id: "c1", otherPartyName: "Tunde A.", otherPartyLogo: null, lastMessageAt: new Date().toISOString() },
  { id: "c2", otherPartyName: "Ifeoma O.", otherPartyLogo: null, lastMessageAt: new Date(Date.now() - 86400000).toISOString() }
];

export const SAMPLE_MESSAGES = [
  { id: "m1", conversation_id: "c1", sender_id: "them", body: "Hey, do you have any slots today?", read_at: null, created_at: new Date().toISOString() },
  { id: "m2", conversation_id: "c1", sender_id: "me", body: "Yep — 4pm or 6:30pm both open.", read_at: null, created_at: new Date().toISOString() }
];
