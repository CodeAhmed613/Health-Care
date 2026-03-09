const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    clinicName: { type: String, required: true },
    vaccineType: { type: String, required: true },
    sessionDate: { type: Date, required: true },
    availableSlots: { type: Number, required: true },
    status: { type: String, default: 'Active' } // Active, Cancelled, or Completed
});

module.exports = mongoose.model('Session', SessionSchema);