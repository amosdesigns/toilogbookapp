-- Create NotificationType enum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNING', 'SUCCESS', 'ERROR', 'ALERT');

-- Create NotificationPriority enum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- Create notifications table
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionLabel" TEXT,
    "actionUrl" TEXT,
    "dismissible" BOOLEAN NOT NULL DEFAULT true,
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");
CREATE INDEX "notifications_dismissedAt_idx" ON "notifications"("dismissedAt");
CREATE INDEX "notifications_priority_idx" ON "notifications"("priority");
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- Add foreign key
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert test notifications
INSERT INTO "notifications" ("id", "userId", "type", "priority", "title", "message", "actionLabel", "actionUrl", "dismissible", "createdAt", "updatedAt") VALUES
('test_notif_1', NULL, 'INFO', 'HIGH', 'Welcome to the Notification System!', 'This is a test notification to verify the notification banner is working correctly across both interfaces.', 'View Dashboard', '/admin/dashboard', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('test_notif_2', NULL, 'ALERT', 'URGENT', 'System Maintenance Scheduled', 'The system will undergo maintenance on Friday at 2:00 AM EST. Please save your work.', NULL, NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('test_notif_3', NULL, 'SUCCESS', 'MEDIUM', 'New Feature Available', 'Check out the new notification system! You can now receive important updates and alerts.', NULL, NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
