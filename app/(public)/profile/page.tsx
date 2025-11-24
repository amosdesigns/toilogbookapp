import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getCurrentUser } from '@/lib/auth/sync-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Mail, Phone, MapPin, User, Calendar } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default async function ProfilePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Profile</h1>
        <Button asChild>
          <Link href={`/profile/edit/${user.id}`}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Profile
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Your account details and personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Photo */}
          <div className="flex items-center gap-4">
            <div className="relative h-24 w-24 rounded-full overflow-hidden bg-muted">
              {user.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt={`${user.firstName} ${user.lastName}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full bg-primary text-primary-foreground text-2xl font-semibold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-semibold">
                {user.firstName} {user.lastName}
              </h2>
              <Badge variant="outline" className="mt-1">
                {user.role.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          {/* Account Information */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </div>
              <p className="font-medium">{user.email}</p>
            </div>

            {user.username && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Username</span>
                </div>
                <p className="font-medium">{user.username}</p>
              </div>
            )}

            {user.phone && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>Phone</span>
                </div>
                <p className="font-medium">{user.phone}</p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Member Since</span>
              </div>
              <p className="font-medium">{formatDateTime(user.createdAt)}</p>
            </div>
          </div>

          {/* Address Information */}
          {(user.streetAddress || user.city || user.state || user.zipCode) && (
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Address</span>
              </div>
              <div className="font-medium">
                {user.streetAddress && <p>{user.streetAddress}</p>}
                {(user.city || user.state || user.zipCode) && (
                  <p>
                    {user.city}
                    {user.city && user.state && ', '}
                    {user.state} {user.zipCode}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
