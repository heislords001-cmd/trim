// Hand-written baseline matching supabase/schema.sql.
// Once your project is linked, regenerate the real thing with:
//   npm run supabase:types
// and this file becomes auto-generated (don't hand-edit past that point).

export type UserRole = "customer" | "barber" | "admin";
export type BarberStatus = "pending" | "approved" | "rejected" | "suspended";
export type BookingStatus = "requested" | "confirmed" | "completed" | "cancelled";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BarberProfile {
  id: string;
  owner_id: string;
  business_name: string;
  slug: string;
  description: string | null;
  business_phone: string | null;
  whatsapp_number: string | null;
  logo_url: string | null;
  status: BarberStatus;
  is_verified: boolean;
  rating_average: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface BusinessLocation {
  id: string;
  barber_id: string;
  address: string;
  city: string;
  state_region: string | null;
  country: string;
  // Exposed to the client as GeoJSON by PostgREST, e.g. { type: "Point", coordinates: [lng, lat] }
  geog: { type: "Point"; coordinates: [number, number] };
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  barber_id: string;
  name: string;
  price_naira: number;
  duration_minutes: number | null;
  sort_order: number;
  created_at: string;
}

export interface BusinessHour {
  id: string;
  barber_id: string;
  day_of_week: number; // 0 = Sunday
  is_open: boolean;
  open_time: string | null; // "HH:MM:SS"
  close_time: string | null;
}

export interface BarberImage {
  id: string;
  barber_id: string;
  image_url: string;
  image_type: "shop" | "work" | "logo";
  sort_order: number;
  created_at: string;
}

export interface Review {
  id: string;
  barber_id: string;
  customer_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  barber_id: string;
  customer_id: string;
  service_id: string | null;
  status: BookingStatus;
  scheduled_at: string | null;
  notes: string | null;
  created_at: string;
}

// Shape returned by the nearby_barbers() RPC (see supabase/functions.sql)
export interface NearbyBarberRow {
  barber_id: string;
  business_name: string;
  slug: string;
  logo_url: string | null;
  rating_average: number;
  rating_count: number;
  is_verified: boolean;
  address: string;
  city: string;
  distance_meters: number;
  starting_price: number | null;
}

// Shape returned by nearby_external_listings() — unclaimed barbershops
// pulled in from an outside source (see scripts/sync-external-listings.ts)
// so search isn't limited to accounts registered on the platform.
export interface NearbyExternalListingRow {
  listing_id: string;
  name: string;
  address: string | null;
  city: string | null;
  distance_meters: number;
  lat: number;
  lng: number;
}

// What the discovery UI actually renders: registered barbers and
// unclaimed listings normalized to one shape, distinguished by `source`.
export interface DiscoveryListing {
  id: string;
  source: "platform" | "external";
  name: string;
  slug: string | null;
  logoUrl: string | null;
  ratingAverage: number | null;
  ratingCount: number | null;
  isVerified: boolean;
  address: string | null;
  city: string | null;
  distanceMeters: number;
  startingPrice: number | null;
}

// Minimal Database type so @supabase/ssr generics compile.
// Replace with the real generated type once you run supabase:types.
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      barber_profiles: { Row: BarberProfile; Insert: Partial<BarberProfile>; Update: Partial<BarberProfile> };
      business_locations: { Row: BusinessLocation; Insert: Partial<BusinessLocation>; Update: Partial<BusinessLocation> };
      services: { Row: Service; Insert: Partial<Service>; Update: Partial<Service> };
      business_hours: { Row: BusinessHour; Insert: Partial<BusinessHour>; Update: Partial<BusinessHour> };
      barber_images: { Row: BarberImage; Insert: Partial<BarberImage>; Update: Partial<BarberImage> };
      reviews: { Row: Review; Insert: Partial<Review>; Update: Partial<Review> };
      bookings: { Row: Booking; Insert: Partial<Booking>; Update: Partial<Booking> };
    };
    Functions: {
      nearby_barbers: {
        Args: { search_lat: number; search_lng: number; radius_km?: number; max_results?: number };
        Returns: NearbyBarberRow[];
      };
      nearby_external_listings: {
        Args: { search_lat: number; search_lng: number; radius_km?: number; max_results?: number };
        Returns: NearbyExternalListingRow[];
      };
      upsert_business_location: {
        Args: {
          p_barber_id: string;
          p_address: string;
          p_city: string;
          p_state_region: string | null;
          p_country: string;
          p_lat: number;
          p_lng: number;
        };
        Returns: BusinessLocation;
      };
    };
  };
}

export interface Conversation {
  id: string;
  customer_id: string;
  barber_id: string;
  last_message_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}
