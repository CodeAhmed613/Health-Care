const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['parent', 'operator', 'admin'], default: 'parent' },
    isApproved: { type: Boolean, default: false },
    // ADDED FOR FORGOT PASSWORD
    resetPasswordToken: String,
    resetPasswordExpire: Date
});

module.exports = mongoose.model('User', UserSchema);