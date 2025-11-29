-- Insert test notifications
INSERT INTO "notifications" ("id", "userId", "type", "priority", "title", "message", "actionLabel", "actionUrl", "dismissible", "createdAt", "updatedAt") VALUES
('test_notif_001', NULL, 'INFO', 'HIGH', 'Welcome to the Notification System!', 'This is a test notification to verify the notification banner is working correctly across both interfaces.', 'View Dashboard', '/admin/dashboard', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('test_notif_002', NULL, 'ALERT', 'URGENT', 'System Maintenance Scheduled', 'The system will undergo maintenance on Friday at 2:00 AM EST. Please save your work.', NULL, NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('test_notif_003', NULL, 'SUCCESS', 'MEDIUM', 'New Feature Available', 'Check out the new notification system! You can now receive important updates and alerts.', NULL, NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
