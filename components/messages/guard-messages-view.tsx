"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Plus, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import { sendGuardMessage, getMyMessages, type MessageWithDetails } from "@/lib/actions/message-actions"

interface GuardMessagesViewProps {
  initialMessages: MessageWithDetails[]
  currentUserId: string
}

export function GuardMessagesView({ initialMessages, currentUserId }: GuardMessagesViewProps) {
  const [messages, setMessages] = useState<MessageWithDetails[]>(initialMessages)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Auto-refresh messages every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchMessages = async () => {
    setIsRefreshing(true)
    try {
      const result = await getMyMessages()
      if (result.ok) {
        setMessages(result.data)
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSendMessage = async (content: string) => {
    const result = await sendGuardMessage(content)

    if (!result.ok) {
      toast.error(result.message)
      throw new Error(result.message)
    }

    toast.success("Message sent to all on-duty supervisors")
    setIsDialogOpen(false)

    // Refresh messages to show the newly sent message
    await fetchMessages()
  }

  const handleRefresh = async () => {
    await fetchMessages()
    toast.success("Messages refreshed")
  }

  return (
    <div className="space-y-4">
      {/* Header with send button */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messages
              </CardTitle>
              <CardDescription>
                Send messages to on-duty supervisors and view replies
              </CardDescription>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                <span className="sr-only">Refresh messages</span>
              </Button>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Message to Supervisors</DialogTitle>
                    <DialogDescription>
                      Your message will be sent to all on-duty supervisors
                    </DialogDescription>
                  </DialogHeader>

                  <MessageInput
                    onSend={handleSendMessage}
                    placeholder="Type your message to supervisors..."
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <MessageList messages={messages} currentUserId={currentUserId} />
        </CardContent>
      </Card>
    </div>
  )
}
