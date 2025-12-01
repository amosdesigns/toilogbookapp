"use client"

import { formatDistanceToNow } from "date-fns"
import { MapPin, MessageSquare, User } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ConversationSummary } from "@/lib/actions/message-actions"

interface ConversationCardProps {
  conversation: ConversationSummary
  onClick: () => void
}

export function ConversationCard({
  conversation,
  onClick,
}: ConversationCardProps) {
  const hasUnread = conversation.unreadCount > 0

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
        hasUnread && "border-primary bg-primary/5"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Guard name and location */}
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <h3
                className={cn(
                  "font-semibold truncate",
                  hasUnread && "text-primary"
                )}
              >
                {conversation.guardName}
              </h3>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground truncate">
                {conversation.locationName}
              </p>
            </div>

            {/* Last message preview */}
            <div className="flex items-start gap-2">
              <MessageSquare className="h-3 w-3 text-muted-foreground shrink-0 mt-1" />
              <p className="text-sm text-muted-foreground line-clamp-2">
                {conversation.lastMessage}
              </p>
            </div>

            {/* Timestamp */}
            <p className="text-xs text-muted-foreground mt-2">
              {formatDistanceToNow(new Date(conversation.lastMessageTime), {
                addSuffix: true,
              })}
            </p>
          </div>

          {/* Unread badge */}
          {hasUnread && (
            <Badge variant="default" className="shrink-0">
              {conversation.unreadCount}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
