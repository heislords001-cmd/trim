import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listMessages } from "@/actions/chat";
import ChatThread from "@/components/chat/ChatThread";
import { PREVIEW_MODE } from "@/lib/preview-mode";

export default async function DashboardChatThreadPage({ params }: { params: { conversationId: string } }) {
  let currentUserId = "preview-me";

  if (!PREVIEW_MODE) {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    currentUserId = user!.id;
  }

  const messages = await listMessages(params.conversationId);

  return (
    <div className="flex h-[70vh] flex-col">
      <Link href="/dashboard/chat" className="mb-3 text-sm text-textMuted">← All conversations</Link>
      <ChatThread conversationId={params.conversationId} initialMessages={messages} currentUserId={currentUserId} />
    </div>
  );
}
