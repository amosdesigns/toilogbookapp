"use client"

import { formatDistanceToNow } from "date-fns"
import { User, CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MessageWithDetails } from "@/lib/actions/message-actions"

interface MessageListProps {
  messages: MessageWithDetails[]
  currentUserId: string
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <User className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No messages yet</h3>
        <p className="text-sm text-muted-foreground">
          Messages will appear here when you send or receive them
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const isSentByMe = message.senderId === currentUserId
        const isReply = message.replyToId !== null

        return (
          <div
            key={message.id}
            className={cn(
              "flex w-full",
              isSentByMe ? "justify-end" : "justify-start",
              isReply && "ml-8"
            )}
          >
            <div
              className={cn(
                "max-w-[70%] rounded-lg px-4 py-2 shadow-sm",
                isSentByMe
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {!isSentByMe && (
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-3 w-3" />
                  <p className="text-xs font-semibold">{message.senderName}</p>
                </div>
              )}

              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>

              <div
                className={cn(
                  "flex items-center gap-2 mt-2 text-xs",
                  isSentByMe ? "text-primary-foreground/70" : "text-muted-foreground"
                )}
              >
                <span>
                  {formatDistanceToNow(new Date(message.createdAt), {
                    addSuffix: true,
                  })}
                </span>

                {message.readAt && (
                  <CheckCheck className="h-3 w-3" />
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
