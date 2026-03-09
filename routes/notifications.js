const router = require('express').Router();
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog'); // Added missing import

// --- NEW: BULK DELETE ---
// This handles the 'Delete Selected' button efficiently
router.post('/delete-bulk', async (req, res) => {
    try {
        const { ids } = req.body; // Expecting an array of IDs
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json("Invalid ID list");
        }
        
        await Notification.deleteMany({ _id: { $in: ids } });
        res.status(200).json("Selected notifications deleted");
    } catch (err) {
        res.status(500).json("Bulk delete failed");
    }
});

// Admin sends notification (Modified to accept 'type')
router.post('/send', async (req, res) => {
    try {
        const { recipientId, message, type } = req.body;
        const newNotif = new Notification({
            recipientId,
            message,
            type: type || 'admin_alert'
        });
        await newNotif.save();
        res.status(200).json("Notification sent!");
    } catch (err) { res.status(500).json(err); }
});

// Parents get their notifications
router.get('/:userId', async (req, res) => {
    try {
        const notifications = await Notification.find({
            $or: [{ recipientId: req.params.userId }, { recipientId: 'all' }]
        }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) { res.status(500).json("Error fetching notifications"); }
});

// Mark a specific notification as read
router.put('/read/:id', async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json("Marked as read");
    } catch (err) { res.status(500).json(err); }
});

// Mark ALL read
router.put('/read-all/:userId', async (req, res) => {
    try {
        await Notification.updateMany(
            { recipientId: req.params.userId, isRead: false },
            { isRead: true }
        );
        res.json("All notifications marked as read");
    } catch (err) { res.status(500).json(err); }
});

// DELETE a notification
router.delete('/:id', async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.status(200).json("Notification deleted");
    } catch (err) {
        res.status(500).json("Error deleting");
    }
});

// Route: POST /api/notifications/reply
// Matches frontend: API.post('/api/notifications/reply')
router.post('/reply', async (req, res) => {
    try {
        const { message, senderId, senderName, originalMessageId } = req.body;

        // 1. Create a notification for the Admin to see in their Inbox
        const adminNotif = new Notification({
            recipientId: 'admin', 
            senderId,
            senderName,
            message: `REPLY to [${originalMessageId}]: ${message}`,
            type: 'parent_reply',
            isRead: false
        });
        await adminNotif.save();

        // 2. Create an Activity Log so it shows up on the Admin Dashboard immediately
        const newLog = new ActivityLog({
            action: "User Reply Received",
            performedBy: senderName || senderId,
            details: message,
            timestamp: new Date()
        });
        await newLog.save();

        res.status(200).json({ success: true });
    } catch (err) {
        console.error("Backend Reply Error:", err);
        res.status(500).json({ message: "Server error during reply" });
    }
});

module.exports = router;