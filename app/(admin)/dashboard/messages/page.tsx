import { Metadata } from "next"
import { getCurrentUser } from "@/lib/auth/sync-user"
import { getGuardConversations } from "@/lib/actions/message-actions"
import { SupervisorMessagesView } from "@/components/messages/supervisor-messages-view"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Messages | Supervisor Dashboard",
  description: "View and respond to guard messages",
}

export default async function SupervisorMessagesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Only supervisors and above can access message management
  if (user.role === "GUARD") {
    redirect("/");
  }

  // Fetch conversations
  const result = await getGuardConversations();
  const conversations = result.ok ? result.data : [];

  return (
    <div className="container max-w-6xl mx-auto py-6">
      <SupervisorMessagesView initialConversations={conversations} />
    </div>
  );
}
