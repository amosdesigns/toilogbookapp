import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // In production, mark notification as dismissed in database
    // For now, just return success
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error dismissing notification:", error)
    return NextResponse.json(
      { error: "Failed to dismiss notification" },
      { status: 500 }
    )
  }
}
