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
// a barber sees the customer's name — same query, just returning
// whichever side isn't the signed-in user.
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
    const { data } = await supabase
      .from("conversations")
      .select("id, last_message_at, profiles!conversations_customer_id_fkey(full_name)")
      .eq("barber_id", barber.id)
      .order("last_message_at", { ascending: false });
    return (data ?? []).map((row: any) => ({
      id: row.id,
      otherPartyName: row.profiles?.full_name || "Customer",
      otherPartyLogo: null,
      lastMessageAt: row.last_message_at
    }));
  }

  const { data } = await supabase
    .from("conversations")
    .select("id, last_message_at, barber_profiles(business_name, logo_url)")
    .eq("customer_id", user.id)
    .order("last_message_at", { ascending: false });

  return (data ?? []).map((row: any) => ({
    id: row.id,
    otherPartyName: row.barber_profiles?.business_name ?? "Barber",
    otherPartyLogo: row.barber_profiles?.logo_url ?? null,
    lastMessageAt: row.last_message_at
  }));
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
