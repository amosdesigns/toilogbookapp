"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserDropdown } from "@/components/user-dropdown"

interface MobileHeaderProps {
  title: string
  onMenuClick?: () => void
  user: {
    firstName: string
    lastName: string
    email: string
    role: string
  }
}

export function MobileHeader({ title, onMenuClick, user }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        {onMenuClick && (
          <Button variant="ghost" size="icon" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-lg font-semibold truncate flex-1 text-center">
          {title}
        </h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserDropdown user={user} />
        </div>
      </div>
    </header>
  )
}
