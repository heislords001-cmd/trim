"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// Called from the "Message" button on a barber's public profile. Reuses
// an existing conversation if one already exists for this pair (the
// unique(customer_id, barber_id) constraint makes that safe to rely on)
// instead of creating a new thread every time someone hits the button.
export async function startConversation(barberId: string) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?redirect=/barbers`);

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("customer_id", user!.id)
    .eq("barber_id", barberId)
    .maybeSingle();

  if (existing) redirect(`/chat/${existing.id}`);

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ customer_id: user!.id, barber_id: barberId })
    .select("id")
    .single();

  if (error || !created) throw new Error(error?.message ?? "Could not start conversation");
  redirect(`/chat/${created.id}`);
}

export interface ConversationSummary {
  id: string;
  otherPartyName: string;
  otherPartyLogo: string | null;
  lastMessageAt: string;
}

// Works for both sides: a customer sees the barber's name on each row,
// a barber sees the customer's name — same shape either way. Deliberately
// avoids PostgREST's embedded `table(column)` select syntax and does two
// plain queries + an in-memory join instead: with a hand-written Database
// type (no Relationships metadata), the embedded-select generic can
// silently mistype or fail to compile, and this sidesteps that entirely.
export async function listMyConversations(): Promise<ConversationSummary[]> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isBarber = profile?.role === "barber";

  if (isBarber) {
    const { data: barber } = await supabase.from("barber_profiles").select("id").eq("owner_id", user.id).maybeSingle();
    if (!barber) return [];

    const { data: conversations } = await supabase
      .from("conversations")
      .select("id, customer_id, last_message_at")
      .eq("barber_id", barber.id)
      .order("last_message_at", { ascending: false });
    if (!conversations || conversations.length === 0) return [];

    const customerIds = conversations.map((c) => c.customer_id);
    const { data: customers } = await supabase.from("profiles").select("id, full_name").in("id", customerIds);
    const nameById = new Map((customers ?? []).map((c) => [c.id, c.full_name]));

    return conversations.map((c) => ({
      id: c.id,
      otherPartyName: nameById.get(c.customer_id) || "Customer",
      otherPartyLogo: null,
      lastMessageAt: c.last_message_at
    }));
  }

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, barber_id, last_message_at")
    .eq("customer_id", user.id)
    .order("last_message_at", { ascending: false });
  if (!conversations || conversations.length === 0) return [];

  const barberIds = conversations.map((c) => c.barber_id);
  const { data: barbers } = await supabase
    .from("barber_profiles")
    .select("id, business_name, logo_url")
    .in("id", barberIds);
  const barberById = new Map((barbers ?? []).map((b) => [b.id, b]));

  return conversations.map((c) => {
    const barber = barberById.get(c.barber_id);
    return {
      id: c.id,
      otherPartyName: barber?.business_name ?? "Barber",
      otherPartyLogo: barber?.logo_url ?? null,
      lastMessageAt: c.last_message_at
    };
  });
}

export async function listMessages(conversationId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function sendMessage(conversationId: string, body: string) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };
  if (!body.trim()) return { ok: false, error: "Message can't be empty" };

  const { error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: user.id, body: body.trim() });

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/chat/${conversationId}`);
  return { ok: true };
}
