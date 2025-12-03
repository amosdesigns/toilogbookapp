"use client"

import { useState, KeyboardEvent } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface MessageInputProps {
  onSend: (content: string) => void | Promise<void>
  placeholder?: string
  disabled?: boolean
}

export function MessageInput({
  onSend,
  placeholder = "Type your message...",
  disabled = false,
}: MessageInputProps) {
  const [content, setContent] = useState("")
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    if (!content.trim() || isSending || disabled) return

    setIsSending(true)
    try {
      await onSend(content.trim())
      setContent("") // Clear input after successful send
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Ctrl+Enter or Cmd+Enter
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex gap-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isSending}
        className="min-h-[80px] resize-none"
        maxLength={1000}
      />

      <Button
        onClick={handleSend}
        disabled={!content.trim() || isSending || disabled}
        size="icon"
        className="h-[80px] w-12 shrink-0"
      >
        <Send className="h-4 w-4" />
        <span className="sr-only">Send message</span>
      </Button>
    </div>
  )
}
