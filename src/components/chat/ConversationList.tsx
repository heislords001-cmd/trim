import Link from "next/link";
import Image from "next/image";
import type { ConversationSummary } from "@/actions/chat";

export default function ConversationList({ conversations, basePath }: { conversations: ConversationSummary[]; basePath: string }) {
  if (conversations.length === 0) {
    return <p className="p-6 text-center text-sm text-textMuted">No conversations yet.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {conversations.map((c) => (
        <li key={c.id}>
          <Link href={`${basePath}/${c.id}`} className="flex items-center gap-3 px-1 py-3">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-surfaceMuted">
              {c.otherPartyLogo ? (
                <Image src={c.otherPartyLogo} alt={c.otherPartyName} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-lg">💬</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-textPrimary">{c.otherPartyName}</p>
              <p className="text-xs text-textMuted">
                {new Date(c.lastMessageAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
