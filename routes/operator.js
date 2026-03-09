const router = require('express').Router();
const Infant = require('../models/Infant');
const User = require('../models/User');

// UC016: Operator views the Customer Table
router.get('/customers', async (req, res) => {
    try {
        const infants = await Infant.find().populate('parentId', 'name email');
        res.json(infants);
    } catch (err) {
        res.status(500).json("Error fetching customer data");
    }
});

// UC018: Logic for Support Tickets (Placeholder for now)
router.post('/ticket', async (req, res) => {
    res.json("Support ticket received and logged.");
});

module.exports = router;