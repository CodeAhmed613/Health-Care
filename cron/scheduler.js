const cron = require('node-cron');
const Infant = require('../models/Infant');
const Notification = require('../models/Notification');

// This function calculates weeks from DOB
const calculateWeeks = (dob) => {
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
};

// Schedule task to run every day at 08:00 AM
cron.schedule('0 8 * * *', async () => {
    console.log('Running daily vaccine check...');
    try {
        const infants = await Infant.find();
        
        for (const infant of infants) {
            const ageInWeeks = calculateWeeks(infant.dob);
            
            // Define the milestones you want to alert
            const milestones = [6, 10, 14]; 
            
            if (milestones.includes(ageInWeeks)) {
                // Check if we already sent this reminder today to avoid duplicates
                const alreadySent = await Notification.findOne({
                    recipientId: infant.parentId,
                    message: { $regex: infant.name },
                    createdAt: { $gte: new Date().setHours(0,0,0,0) }
                });

                if (!alreadySent) {
                    await new Notification({
                        recipientId: infant.parentId,
                        type: 'vaccine_reminder',
                        message: `Reminder: ${infant.name} is now ${ageInWeeks} weeks old. Please check the vaccination roadmap for due shots!`
                    }).save();
                    console.log(`Notification sent for ${infant.name}`);
                }
            }
        }
    } catch (err) {
        console.error('Cron Job Error:', err);
    }
});