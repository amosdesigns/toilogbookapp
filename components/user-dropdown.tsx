"use client"

import { useEffect, useState } from "react"
import {  LogOut } from "lucide-react"
import { SignOutButton } from "@clerk/nextjs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

interface UserDropdownProps {
  user: {
    firstName: string
    lastName: string
    email: string
    role: string
    imageUrl?: string | null
  }
}

export function UserDropdown( { user }: UserDropdownProps ) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if ( !user ) {
    return null
  }

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  const fullName = `${user.firstName} ${user.lastName}`

  // Don't render dropdown until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="rounded-full">
        <Avatar className="h-8 w-8">
          {user.imageUrl && <AvatarImage src={user.imageUrl} alt={fullName} />}
          <AvatarFallback className="bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className="h-8 w-8">
            {user.imageUrl && <AvatarImage src={user.imageUrl} alt={fullName} />}
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{fullName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground mt-1">
              Role: {user.role}
            </p>
          </div>
        </DropdownMenuLabel>
        {(user.role!== "GUARD" ) ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/dashboard">Dashboard</Link>
            </DropdownMenuItem>
          </>
        ):""}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <SignOutButton redirectUrl="/sign-in">
            <div className="flex items-center w-full">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </div>
          </SignOutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
