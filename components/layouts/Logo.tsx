"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  size?: number
  className?: string
  showText?: boolean
  textSize?: "sm" | "md" | "lg"
}

export default function Logo({
  size = 32,
  className,
  showText = false,
  textSize = "sm"
}: LogoProps) {
  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Light mode logo */}
      <Image
        src="/images/toilogo.png"
        alt="Town of Islip"
        width={size}
        height={size}
        className="block dark:hidden"
        priority
      />
      {/* Dark mode logo */}
      <Image
        src="/images/seal_blue_sm.png"
        alt="Town of Islip"
        width={size}
        height={size}
        className="hidden dark:block"
        priority
      />
      {showText && (
        <div className="flex flex-col">
          <span className={cn("font-semibold", textSizeClasses[textSize])}>
            Marina Guard
          </span>
          <span className="text-xs text-muted-foreground">
            Town of Islip
          </span>
        </div>
      )}
    </div>
  )
}
