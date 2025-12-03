import { Metadata } from "next"
import { getCurrentUser } from "@/lib/auth/sync-user"
import { getMyMessages } from "@/lib/actions/message-actions"
import { GuardMessagesView } from "@/components/messages/guard-messages-view"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Messages | Guard Dashboard",
  description: "Send messages to supervisors and view replies",
}

export default async function MessagesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/")
  }

  // Fetch messages
  const result = await getMyMessages()
  const messages = result.ok ? result.data : []

  return (
    <div className="container max-w-4xl mx-auto py-6">
      <GuardMessagesView initialMessages={messages} currentUserId={user.id} />
    </div>
  )
}
