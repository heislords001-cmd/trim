import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listMessages } from "@/actions/chat";
import ChatThread from "@/components/chat/ChatThread";

export default async function ChatThreadPage({ params }: { params: { conversationId: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?redirect=/chat/${params.conversationId}`);

  // RLS on `messages` already scopes this to conversations the signed-in
  // user is actually a participant in — an empty array here just means
  // "not found or not yours", which is the safe default either way.
  const messages = await listMessages(params.conversationId);

  return (
    <main className="mx-auto flex h-screen max-w-2xl flex-col px-4 py-6">
      <Link href="/chat" className="mb-4 text-sm text-textMuted">← All conversations</Link>
      <ChatThread conversationId={params.conversationId} initialMessages={messages} currentUserId={user.id} />
    </main>
  );
}
