import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Await the params
    const { id } = await params

    const body = await request.json()
    const { endTime, notes } = body

    // Update duty session
    const session = await prisma.dutySession.update({
      where: { id },
      data: {
        clockOutTime: endTime ? new Date(endTime) : new Date(),
        notes,
      },
    })

    return NextResponse.json(session)
  } catch (error) {
    console.error("Error updating duty session:", error)
    return NextResponse.json(
      { error: "Failed to update duty session" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Await the params
    const { id } = await params

    const session = await prisma.dutySession.findUnique({
      where: { id },
      include: {
        shift: true,
        location: true,
        locationCheckIns: true,
      },
    })

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error("Error fetching duty session:", error)
    return NextResponse.json(
      { error: "Failed to fetch duty session" },
      { status: 500 }
    )
  }
}
