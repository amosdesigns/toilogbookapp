"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getUserById, updateUserProfile, getCurrentUserAction } from '@/lib/actions/users'
import { ProfileForm } from '@/components/forms/profile-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { UserProfile } from '@/lib/types/prisma-types'
import type { User } from '@prisma/client'

export default function EditProfilePage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<UserProfile | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)

        // Get current user to verify authorization
        const currentUserResult = await getCurrentUserAction()
        if (!currentUserResult.ok) {
          setError('Unauthorized')
          return
        }
        setCurrentUser(currentUserResult.data)

        // Verify that the user is editing their own profile
        if (currentUserResult.data.id !== userId) {
          setError('You can only edit your own profile')
          return
        }

        // Fetch user data
        const result = await getUserById(userId)
        if (!result.ok) {
          setError(result.message)
          return
        }

        setUser(result.data)
      } catch (err) {
        console.error('Error fetching user:', err)
        setError('Failed to load user data')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [userId])

  const handleSubmit = async (data: {
    firstName: string
    lastName: string
    imageUrl?: string | null
    phone?: string | null
    streetAddress?: string | null
    city?: string | null
    state?: string | null
    zipCode?: string | null
  }) => {
    const result = await updateUserProfile(userId, data)

    if (!result.ok) {
      toast.error(result.message)
    } else {
      toast.success(result.message || 'Profile updated successfully')
      router.push('/profile')
      router.refresh()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Edit Profile</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error || 'User not found'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Profile</h1>
        <p className="text-muted-foreground mt-2">
          Update your personal information and profile settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your profile details. Email and username cannot be changed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            onSubmit={handleSubmit}
            defaultValues={{
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              imageUrl: user.imageUrl || '',
              phone: user.phone || '',
              streetAddress: user.streetAddress || '',
              city: user.city || '',
              state: user.state || '',
              zipCode: user.zipCode || '',
            }}
            lockedEmail={user.email}
            lockedUsername={user.username}
          />
        </CardContent>
      </Card>
    </div>
  )
}
