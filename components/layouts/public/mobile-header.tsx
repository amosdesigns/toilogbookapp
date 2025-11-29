"use client"

import { useEffect, useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserDropdown } from "@/components/user-dropdown"
import Logo from "@/components/layouts/Logo"
import { getActiveDutySession } from "@/lib/actions/duty-session-actions"

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
  const [isOnDuty, setIsOnDuty] = useState(false)
  const [locationName, setLocationName] = useState<string | null>(null)

  useEffect(() => {
    const checkDutyStatus = async () => {
      try {
        const result = await getActiveDutySession()
        if (result.ok && result.data) {
          setIsOnDuty(true)
          setLocationName(result.data.location?.name || null)
        } else {
          setIsOnDuty(false)
          setLocationName(null)
        }
      } catch (error) {
        console.error('Error checking duty status:', error)
      }
    }

    checkDutyStatus()

    // Poll every 30 seconds to keep status updated
    const interval = setInterval(checkDutyStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex items-center justify-between h-14 px-4 gap-2">
        {onMenuClick && (
          <Button variant="ghost" size="icon" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="flex items-center gap-2 flex-1">
          <Logo size={32} />
          <h1 className="text-xs font-semibold truncate">
            {title}
          </h1>
        </div>

        {/* Duty Status Badge with Location - Between title and controls */}
        <div className="flex items-center gap-2">
          {isOnDuty ? (
            <>
              <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white text-xs shrink-0">
                On Duty
              </Badge>
              <span className="text-xs font-medium text-muted-foreground shrink-0">
                @ {locationName ? (locationName.length > 10 ? locationName.slice(0, 10) + "..." : locationName) : "Roaming"}
              </span>
            </>
          ) : (
            <Badge variant="secondary" className="text-xs shrink-0">
              Off Duty
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <UserDropdown user={user} />
        </div>
      </div>
    </header>
  )
}
