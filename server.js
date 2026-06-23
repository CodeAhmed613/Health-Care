const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const operatorRoutes = require('./routes/operator');
const infantRoutes = require('./routes/infant');
const notificationRoutes = require('./routes/notifications');

const app = express();

// --- Middleware ---
app.use(express.json());

// Configure CORS for local development and your Vercel production domain
const allowedOrigins = [
    'http://localhost:3000',             // React local dev
    'http://localhost:5173',             // Vite local dev
    'https://health-care613.vercel.app'  // Your production Vercel app
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow server-to-server or tools like Postman (which don't send an origin header)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// --- MongoDB connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ DB Connected");
        require('./cron/scheduler'); // background tasks
    })
    .catch(err => console.error(err));

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/operator', operatorRoutes);
app.use('/api/infant', infantRoutes);
app.use('/api/notifications', notificationRoutes);

// --- Start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});