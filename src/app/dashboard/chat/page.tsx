import { listMyConversations } from "@/actions/chat";
import ConversationList from "@/components/chat/ConversationList";

export default async function DashboardChatPage() {
  const conversations = await listMyConversations();
  return <ConversationList conversations={conversations} basePath="/dashboard/chat" />;
}
