"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { ArrowLeft, MapPin, User, Clock, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageList } from "@/components/messages/message-list"
import { MessageInput } from "@/components/messages/message-input"
import {
  getConversationThread,
  sendSupervisorReply,
  type MessageWithDetails,
} from "@/lib/actions/message-actions"

interface ConversationViewProps {
  initialMessages: MessageWithDetails[]
  guardInfo: {
    name: string
    location: string | null
    onDutySince: Date
  } | null
  guardUserId: string
  currentUserId: string
}

export function ConversationView({
  initialMessages,
  guardInfo,
  guardUserId,
  currentUserId,
}: ConversationViewProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<MessageWithDetails[]>(initialMessages)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadConversation()
    }, 30000)

    return () => clearInterval(interval)
  }, [guardUserId])

  const loadConversation = async () => {
    setIsRefreshing(true)
    try {
      const result = await getConversationThread(guardUserId)

      if (!result.ok) {
        toast.error(result.message)
        return
      }

      setMessages(result.data)
    } catch (error) {
      console.error("Failed to load conversation:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSendReply = async (content: string) => {
    const result = await sendSupervisorReply(guardUserId, content)

    if (!result.ok) {
      toast.error(result.message)
      throw new Error(result.message)
    }

    toast.success("Reply sent")
    await loadConversation()
  }

  const handleRefresh = async () => {
    await loadConversation()
    toast.success("Conversation refreshed")
  }

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Messages
      </Button>

      {/* Guard info card */}
      {guardInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {guardInfo.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-4">
              {guardInfo.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {guardInfo.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                On duty{" "}
                {formatDistanceToNow(new Date(guardInfo.onDutySince), {
                  addSuffix: true,
                })}
              </span>
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Message thread card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Conversation</CardTitle>

            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="sr-only">Refresh conversation</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <MessageList messages={messages} currentUserId={currentUserId} />

          <div className="pt-4 border-t">
            <MessageInput
              onSend={handleSendReply}
              placeholder="Type your reply..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
