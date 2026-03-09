const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
    // Changed to String to accept names like "Ana Paps"
    performedBy: { 
        type: String, 
        required: true 
    },
    infantId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Infant' 
    },
    action: { 
        type: String, 
        required: true 
    },
    details: { 
        type: String 
    }, 
    timestamp: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);