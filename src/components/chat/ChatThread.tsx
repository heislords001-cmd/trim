"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/actions/chat";
import { PREVIEW_MODE } from "@/lib/preview-mode";
import type { Message } from "@/lib/types/database.types";

export default function ChatThread({
  conversationId,
  initialMessages,
  currentUserId
}: {
  conversationId: string;
  initialMessages: Message[];
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Live updates: anyone typing in this conversation (from either side)
  // shows up immediately without a page refresh. Skipped in PREVIEW_MODE
  // since there's no real Supabase project/table to subscribe to yet.
  useEffect(() => {
    if (PREVIEW_MODE) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    const body = draft;
    setDraft("");
    const result = await sendMessage(conversationId, body);
    setSending(false);
    if (!result.ok) {
      setDraft(body); // put it back so nothing's lost
      return;
    }
    // No real DB row means no realtime INSERT event will arrive — append
    // it locally so sending still feels real while browsing in preview mode.
    if (PREVIEW_MODE) {
      setMessages((prev) => [
        ...prev,
        { id: `local-${Date.now()}`, conversation_id: conversationId, sender_id: currentUserId, body, read_at: null, created_at: new Date().toISOString() }
      ]);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto px-1 py-2">
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  mine ? "bg-accent text-accentInk" : "bg-surfaceMuted text-textPrimary"
                }`}
              >
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2 border-t border-border pt-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message"
          className="input flex-1"
        />
        <button disabled={sending} className="btn-primary px-5">Send</button>
      </form>
    </div>
  );
}
