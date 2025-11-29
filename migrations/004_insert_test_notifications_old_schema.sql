-- Insert test notifications using the old schema structure
-- This assumes the table has: id, user, action, target, message, unread, createdAt, updateAt
INSERT INTO "notifications" ("id", "user", "action", "target", "message", "unread", "createdAt", "updateAt") VALUES
('test_notif_001', 'global', 'UPDATED', 'SUPERVISOR', 'Welcome to the Notification System! This is a test notification.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('test_notif_002', 'global', 'ADDED', 'SUPERADMIN', 'System Maintenance Scheduled - Friday at 2:00 AM EST.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('test_notif_003', 'global', 'UPDATED', 'GUARD', 'New notification system feature available!', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
