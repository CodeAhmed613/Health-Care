const router = require('express').Router();
const User = require('../models/User');
const Infant = require('../models/Infant');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog'); // <--- ADDED THIS (Was missing)

// GET ALL USERS (General list)
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json("Error fetching users");
    }
});

// NEW: APPROVE OPERATOR
router.put('/approve-operator/:id', async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id, 
            { isApproved: req.body.isApproved }, 
            { new: true }
        );
        res.json(updatedUser);
    } catch (err) {
        res.status(500).json("Error approving user");
    }
});

// UPDATE USER ROLE
router.put('/update-role/:id', async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { role: req.body.role },
            { new: true }
        );
        res.json(updatedUser);
    } catch (err) {
        res.status(500).json("Role update failed");
    }
});

// DELETE user and records
router.delete('/user/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        await Infant.deleteMany({ parentId: req.params.id });
        res.json("User deleted.");
    } catch (err) {
        res.status(500).json(err);
    }
});

// FIXED: Send notification (Includes Type)
router.post('/notify', async (req, res) => {
    try {
        const { recipientId, message, type } = req.body;
        
        // 2. Ensure Notification is imported correctly above
        const newNotif = new Notification({ recipientId, message, type });
        await newNotif.save();

        if (recipientId === 'admin' || type === 'user_reply') {
            // 3. Add a check for req.user to prevent "cannot read property id of undefined"
            const performer = req.user ? req.user.id : recipientId; 

            await ActivityLog.create({
                action: "User Reply Received",
                performedBy: performer, 
                details: message
            });
        }
        
        res.status(200).send("Dispatched");
    } catch (err) {
        console.error("Notify Error:", err);
        res.status(500).json({ error: err.message });
    }
});
// Example backend route in admin.js
router.get('/activity-logs', async (req, res) => {
    try {
        const logs = await ActivityLog.find()
            .populate('performedBy', 'name email') // This "fills in" the user details
            .sort({ timestamp: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: "Error fetching logs" });
    }
});

// GET users with infant data (Supporting multiple infants per parent)
router.get('/users-with-infants', async (req, res) => {
    try {
        const allUsers = await User.find().select('-password').lean();
        const allInfants = await Infant.find().lean();

        // 1. Group multiple infants by parentId
        const joinedData = allUsers.map(user => {
            const children = allInfants.filter(i => String(i.parentId) === String(user._id));
            
            return { 
                ...user, 
                infants: children,           // Array for multiple kids (Frontend uses this)
                infant: children[0] || null  // Fallback for singular logic
            };
        });

        // 2. Add infants that don't have a parent account yet (Guests)
        allInfants.forEach(infant => {
            const hasParent = allUsers.some(u => String(u._id) === String(infant.parentId));
            if (!hasParent) {
                joinedData.push({
                    _id: `temp-${infant._id}`,
                    name: "Unlinked Infant",
                    email: "N/A",
                    role: "guest",
                    infants: [infant], // Consistent array format
                    infant: infant      // Fallback
                });
            }
        });

        res.json(joinedData);
    } catch (err) {
        console.error("Fetch Data Error:", err);
        res.status(500).json("Error fetching user-infant data");
    }
});
// PUT: Mark vaccine as administered
// PUT: Mark vaccine as administered (Now saves the Doctor's Name)
router.put('/administer-vaccine/:infantId', async (req, res) => {
    try {
        // 1. Get operatorName from the request body
        const { vaccineName, dateAdministered, operatorName } = req.body;
        
        const updatedInfant = await Infant.findOneAndUpdate(
            { 
                _id: req.params.infantId, 
                "vaccines.name": vaccineName  
            },
            { 
                $set: { 
                    "vaccines.$.status": "administered", 
                    "vaccines.$.administeredDate": dateAdministered,
                    // 2. SAVE THE DOCTOR NAME HERE
                    "vaccines.$.administeredBy": operatorName || "Unknown Doctor" 
                } 
            },
            { new: true }
        );

        if(!updatedInfant) return res.status(404).json("Infant or Vaccine not found");
        res.json(updatedInfant);
    } catch (err) {
        console.error("Vaccine Update Error:", err);
        res.status(500).json("Server error during update");
    }
});

// Route for Parent to reply to Admin
router.post('/api/notifications/reply', async (req, res) => {
    try {
        const { message, senderId, senderName } = req.body;
        const newNotification = new Notification({
            recipientId: 'admin', // Always admin for replies
            senderId,
            senderName,
            message,
            type: 'parent_reply'
        });
        await newNotification.save();
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to send reply" });
    }
});

module.exports = router;