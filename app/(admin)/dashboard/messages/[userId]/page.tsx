import { Metadata } from "next"
import { getCurrentUser } from "@/lib/auth/sync-user"
import { getConversationThread } from "@/lib/actions/message-actions"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ConversationView } from "./conversation-view"

export const metadata: Metadata = {
  title: "Conversation | Supervisor Dashboard",
  description: "View and respond to guard messages",
}

interface ConversationPageProps {
  params: { userId: string }
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  // Verify supervisor role
  if (user.role === "GUARD") {
    redirect("/");
  }

  // Fetch conversation thread
  const result = await getConversationThread(params.userId)

  if (!result.ok) {
    redirect("/admin/dashboard/messages")
  }

  // Fetch guard info
  const guardSession = await prisma.dutySession.findFirst({
    where: {
      userId: params.userId,
      clockOutTime: null,
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      location: {
        select: {
          name: true,
        },
      },
    },
  })

  const guardInfo = guardSession
    ? {
        name: `${guardSession.user.firstName} ${guardSession.user.lastName}`,
        location: guardSession.location?.name || null,
        onDutySince: guardSession.clockInTime,
      }
    : null

  return (
    <div className="container max-w-4xl mx-auto py-6">
      <ConversationView
        initialMessages={result.data}
        guardInfo={guardInfo}
        guardUserId={params.userId}
        currentUserId={user.id}
      />
    </div>
  )
}
