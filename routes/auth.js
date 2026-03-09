const router = require('express').Router();
const User = require('../models/User');
const Notification = require('../models/Notification');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // ADDED
const nodemailer = require('nodemailer'); // ADDED

// --- EXISTING ROUTES (UNTOUCHED) ---

// REGISTER
router.post('/register', async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        
        const newUser = new User({ 
            ...req.body, 
            password: hashedPassword,
            isApproved: req.body.role === 'operator' ? false : true 
        });

        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (err) {
        res.status(500).json("Registration failed");
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(400).json("User Not Found");

        const validPass = await bcrypt.compare(req.body.password, user.password);
        if (!validPass) return res.status(400).json("Invalid Password");

        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET || 'secret123', 
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                role: user.role,
                isApproved: user.isApproved
            }
        });
    } catch (err) {
        res.status(500).json("Server Error");
    }
});

// UPDATE PROFILE
router.put('/update-profile/:id', async (req, res) => {
    try {
        const { name, currentPassword, newPassword } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json("User not found");

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json("Current password incorrect");

        let updateFields = { name };
        if (newPassword && newPassword.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            updateFields.password = await bcrypt.hash(newPassword, salt);
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id, 
            { $set: updateFields }, 
            { new: true }
        ).select('-password');

        const newNotif = new Notification({
            recipientId: req.params.id,
            type: 'profile_update',
            message: `Hi ${updatedUser.name}, your identity was verified and profile updated.`
        });
        await newNotif.save();

        res.json(updatedUser);
    } catch (err) {
        console.error("Profile Update Error:", err);
        res.status(500).json("Error updating profile and security");
    }
});

// GET USER DETAILS
router.get('/user/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json("User not found");
        res.json(user);
    } catch (err) {
        res.status(500).json("Error fetching user");
    }
});

// --- NEW FORGOT PASSWORD ROUTES ---

// 1. FORGOT PASSWORD - Generate token and send email
router.post('/forgot-password', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(404).json({ message: "Email not found" });

        const resetToken = crypto.randomBytes(20).toString('hex');
        
        // Save hashed token to DB
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 mins

        await user.save();

        const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER, // Set in your .env
                pass: process.env.EMAIL_PASS  // App Password from Google
            }
        });

        await transporter.sendMail({
            to: user.email,
            subject: 'Password Reset Request',
            text: `You requested a password reset. Click the link below to reset it:\n\n${resetUrl}\n\nThis link expires in 30 minutes.`
        });

        res.json({ message: "Reset email sent" });
    } catch (err) {
        res.status(500).json("Error in forgot password");
    }
});

// 2. RESET PASSWORD - Verify token and update password
router.put('/reset-password/:token', async (req, res) => {
    try {
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ message: "Invalid or expired token" });

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.newPassword, salt);
        
        // Clear reset fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();
        res.json({ message: "Password reset successful" });
    } catch (err) {
        res.status(500).json("Error resetting password");
    }
});

module.exports = router;