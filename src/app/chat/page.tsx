import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listMyConversations } from "@/actions/chat";
import ConversationList from "@/components/chat/ConversationList";

export default async function ChatInboxPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/chat");

  const conversations = await listMyConversations();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Messages</h1>
        <Link href="/" className="text-sm text-textMuted">← Home</Link>
      </div>
      <ConversationList conversations={conversations} basePath="/chat" />
    </main>
  );
}
