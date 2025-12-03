"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MessageSquare, RefreshCw, Inbox } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConversationCard } from "./conversation-card"
import { getGuardConversations, type ConversationSummary } from "@/lib/actions/message-actions"

interface SupervisorMessagesViewProps {
  initialConversations: ConversationSummary[]
}

export function SupervisorMessagesView({ initialConversations }: SupervisorMessagesViewProps) {
  const router = useRouter()
  const [conversations, setConversations] = useState<ConversationSummary[]>(initialConversations)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Auto-refresh conversations every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchConversations = async () => {
    setIsRefreshing(true)
    try {
      const result = await getGuardConversations()
      if (result.ok) {
        setConversations(result.data)
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    await fetchConversations()
    toast.success("Conversations refreshed")
  }

  const handleConversationClick = (guardId: string) => {
    router.push(`/admin/dashboard/messages/${guardId}`)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Guard Messages
              </CardTitle>
              <CardDescription>
                View and respond to messages from guards on duty
              </CardDescription>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="sr-only">Refresh conversations</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No messages</h3>
              <p className="text-sm text-muted-foreground">
                Messages from on-duty guards will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conversation) => (
                <ConversationCard
                  key={conversation.guardId}
                  conversation={conversation}
                  onClick={() => handleConversationClick(conversation.guardId)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
