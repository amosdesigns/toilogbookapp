import { prisma } from '../lib/prisma'

async function main() {
  // Create a global notification (visible to all users)
  const notification = await prisma.notification.create({
    data: {
      userId: null, // Global notification
      type: 'INFO',
      priority: 'HIGH',
      title: 'Welcome to the Notification System!',
      message: 'This is a test notification to verify the notification banner is working correctly across both interfaces.',
      actionLabel: 'View Dashboard',
      actionUrl: '/dashboard',
      dismissible: true,
    }
  })

  console.log('✅ Test notification created:', notification)

  // Create an urgent notification
  const urgentNotification = await prisma.notification.create({
    data: {
      userId: null,
      type: 'ALERT',
      priority: 'URGENT',
      title: 'System Maintenance Scheduled',
      message: 'The system will undergo maintenance on Friday at 2:00 AM EST. Please save your work.',
      dismissible: true,
    }
  })

  console.log('✅ Urgent notification created:', urgentNotification)
}

main()
  .catch((e) => {
    console.error('❌ Error creating notifications:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
