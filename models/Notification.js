const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    recipientId: { type: String, required: true },
    senderId: { type: String },
    senderName: { type: String },

    // ⭐ ADD THIS FIELD
    message: { type: String, required: true },

    type: { 
        type: String, 
        enum: [
            'admin_alert',
            'profile_update',
            'vaccine_reminder',
            'vaccine_update',
            'parent_reply'
        ], 
        default: 'admin_alert' 
    },

    originalMessageId: { type: String },

    isRead: { type: Boolean, default: false },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', NotificationSchema);