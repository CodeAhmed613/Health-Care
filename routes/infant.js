const router = require('express').Router();
const Infant = require('../models/Infant');
const ActivityLog = require('../models/ActivityLog');
const mongoose = require('mongoose');

// --- 1. INTERNAL HELPERS ---

const addMonths = (dateStr, months) => {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + months);
    return d;
};

const getVaccineStatus = (dueDate) => {
    if (!dueDate) return "Upcoming";
    const d = new Date(dueDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Compare only dates
    return d < now ? "Overdue" : "Upcoming";
};

const createRoadmap = (dob) => [
    { vaccine: "BCG", dueDate: new Date(dob), status: getVaccineStatus(dob) },
    { vaccine: "Hepatitis B", dueDate: addMonths(dob, 2), status: getVaccineStatus(addMonths(dob, 2)) },
    { vaccine: "Polio", dueDate: addMonths(dob, 4), status: getVaccineStatus(addMonths(dob, 4)) },
    { vaccine: "Measles", dueDate: addMonths(dob, 9), status: getVaccineStatus(addMonths(dob, 9)) }
];

// --- 2. ACTION ROUTES ---

// CREATE: Add new infant (Used by Parents or Registration)
router.post('/add', async (req, res) => {
    try {
        const { name, dob, healthId, parentId } = req.body;
        if (!name || !dob || !healthId || !parentId) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const roadmap = createRoadmap(dob);
        const newInfant = new Infant({ name, dob: new Date(dob), healthId, parentId, roadmap });
        const saved = await newInfant.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE: Modify infant profile (Name/Health ID)
router.put('/update-info', async (req, res) => {
    try {
        const { infantId, name, healthId } = req.body;
        const updated = await Infant.findByIdAndUpdate(
            infantId,
            { $set: { name, healthId } },
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: "Infant not found" });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: "Profile update failed" });
    }
});

// UPDATE: Change vaccine status + Log activity (Used by Doctors)
// UPDATE: Change vaccine status + Log activity + Save Administering Doctor
// UPDATE: Change vaccine status + Log activity safely
router.put('/update-vaccine-status', async (req, res) => {
    const { infantId, vaccineName, newStatus, operatorId, operatorName } = req.body;

    try {
        const infant = await Infant.findById(infantId);
        if (!infant) return res.status(404).json({ message: "Infant not found" });

        // Update the roadmap
        let vaccineFound = false;
        infant.roadmap = infant.roadmap.map(v => {
            if (v.vaccine.trim().toLowerCase() === vaccineName.trim().toLowerCase()) {
                vaccineFound = true;
                return {
                    ...v,
                    status: newStatus,
                    administeredBy: newStatus === 'Completed' ? (operatorName || "Authorized Medical Officer") : v.administeredBy,
                    dateAdministered: newStatus === 'Completed' ? new Date() : v.dateAdministered
                };
            }
            return v;
        });

        if (!vaccineFound) {
            return res.status(400).json({ message: `Vaccine "${vaccineName}" not found in roadmap.` });
        }

        // Save infant update
        await infant.save();

        // Log activity but don't block main update
        if (operatorId) {
            try {
                await ActivityLog.create({
                    operatorId,
                    infantId,
                    performedBy: operatorName || "Authorized Medical Officer", // REQUIRED
                    action: `Marked ${vaccineName} as ${newStatus} (Administered by: ${operatorName})`,
                    timestamp: new Date()
                });
            } catch (logErr) {
                console.warn("Activity log failed:", logErr.message);
            }
        }

        // Send success response
        res.status(200).json({
            message: `Vaccine "${vaccineName}" marked as ${newStatus}.`,
            infant
        });

    } catch (err) {
        console.error("Vaccine update error:", err);
        res.status(500).json({ message: "Failed to update vaccine status", error: err.message });
    }
});
// --- 3. RETRIEVAL & SEARCH ROUTES ---

// GET: All infants linked to a parent
router.get('/my-children/:parentId', async (req, res) => {
    try {
        const children = await Infant.find({ parentId: req.params.parentId });
        res.json(children);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch children" });
    }
});

// GET: Search by Health ID
router.get('/search/:healthId', async (req, res) => {
    try {
        const child = await Infant.findOne({ healthId: req.params.healthId });
        if (!child) return res.status(404).json({ message: "No infant found with this Health ID" });
        res.json(child);
    } catch (err) {
        res.status(500).json({ error: "Search failed" });
    }
});

// --- 4. UTILITY ROUTES ---

// REPAIR: Recalculate roadmaps for all infants (Admin Only)
router.get('/fix-invalid-dates', async (req, res) => {
    try {
        const infants = await Infant.find();
        for (let infant of infants) {
            const repairedRoadmap = infant.roadmap.map(item => {
                const status = item.status === 'Completed' ? 'Completed' : getVaccineStatus(item.dueDate);
                return { ...item, status };
            });
            await Infant.findByIdAndUpdate(infant._id, { roadmap: repairedRoadmap });
        }
        res.json({ message: "Database roadmap status check completed." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Inside routes/infant.js
router.get('/all', async (req, res) => {
    try {
        // We use .find({}) to get EVERY infant regardless of parent status
        const infants = await Infant.find({});
        console.log(`Found ${infants.length} infants`); 
        res.json(infants);
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});
module.exports = router;