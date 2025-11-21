import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const locations = await prisma.location.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })

    return Response.json({ data: locations }, { status: 200 })
  } catch (error) {
    console.error('Error fetching locations:', error)
    return Response.json({ error: 'Failed to fetch locations' }, { status: 500 })
  }
}
