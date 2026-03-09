const mongoose = require('mongoose');

const InfantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    dob: { type: Date, required: true },
    healthId: { type: String, required: true, unique: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    roadmap: [
        {
            vaccine: String,
            dueDate: Date,
            status: { type: String, default: "Upcoming" },
            // --- NEW FIELDS ADDED BELOW ---
            administeredBy: { type: String, default: null }, // Stores the doctor's name
            administeredById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // For internal tracking
            dateAdministered: { type: Date, default: null } // Actual date the doctor clicked "Complete"
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Infant', InfantSchema);