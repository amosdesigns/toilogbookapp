"use client"

import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugUserPage() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>Not signed in</div>
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Your Clerk User Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Clerk User ID:</strong>
            <pre className="bg-gray-100 p-2 rounded mt-1">{user.id}</pre>
          </div>
          <div>
            <strong>Email:</strong>
            <pre className="bg-gray-100 p-2 rounded mt-1">{user.primaryEmailAddress?.emailAddress}</pre>
          </div>
          <div>
            <strong>First Name:</strong>
            <pre className="bg-gray-100 p-2 rounded mt-1">{user.firstName}</pre>
          </div>
          <div>
            <strong>Last Name:</strong>
            <pre className="bg-gray-100 p-2 rounded mt-1">{user.lastName}</pre>
          </div>
          <div>
            <strong>Role (from metadata):</strong>
            <pre className="bg-gray-100 p-2 rounded mt-1">
              {JSON.stringify(user.publicMetadata, null, 2)}
            </pre>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mt-6">
            <h3 className="font-bold mb-2">What to do:</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Copy your Clerk User ID above</li>
              <li>Create a User record in your database with this clerkId</li>
              <li>Or update the seed script to use this clerkId</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
