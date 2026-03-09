const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // This line is key: DELETE any existing user with this email first
        await User.deleteOne({ email: "admin@health.com" });
        console.log("Deleted old admin entry...");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("admin123", salt);

        const admin = new User({
            name: "System Administrator",
            email: "admin@health.com",
            password: hashedPassword,
            role: "admin"
        });

        await admin.save();
        console.log("✅ New Admin Created: admin@health.com / admin123");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

createAdmin();