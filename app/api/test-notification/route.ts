import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // First, let's check if the notifications table exists by trying to query it
    const existingNotifications = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'notifications'
    `

    return NextResponse.json({
      message: 'Table check',
      exists: existingNotifications,
      info: 'If table does not exist, we need to run migrations first'
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check table',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    // Create test notifications
    const notification1 = await prisma.notification.create({
      data: {
        userId: null, // Global notification
        type: 'INFO',
        priority: 'HIGH',
        title: 'Welcome to the Notification System!',
        message: 'This is a test notification to verify the notification banner is working correctly across both interfaces.',
        actionLabel: 'View Dashboard',
        actionUrl: '/admin/dashboard',
        dismissible: true,
      }
    })

    const notification2 = await prisma.notification.create({
      data: {
        userId: null,
        type: 'ALERT',
        priority: 'URGENT',
        title: 'System Maintenance Scheduled',
        message: 'The system will undergo maintenance on Friday at 2:00 AM EST. Please save your work.',
        dismissible: true,
      }
    })

    return NextResponse.json({
      success: true,
      notifications: [notification1, notification2]
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to create notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
