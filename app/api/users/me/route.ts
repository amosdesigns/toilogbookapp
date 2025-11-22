import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        username: true,
        imageUrl: true,
      },
    })

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    return Response.json({ data: user }, { status: 200 })
  } catch (error) {
    console.error('Error fetching current user:', error)
    return Response.json({ error: 'Failed to fetch current user' }, { status: 500 })
  }
}
