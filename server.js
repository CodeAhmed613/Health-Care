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
app.use(express.json());
app.use(cors());

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

// --- React Frontend ---
const frontendPath = path.join(__dirname, 'client', 'build');
app.use(express.static(frontendPath));
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// --- Start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://192.168.8.189:${PORT}`);
});