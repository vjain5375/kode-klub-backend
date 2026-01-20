const SiteStats = require('../models/SiteStats');

const trackVisits = async (req, res, next) => {
    try {
        // Simple distinct visitor tracking based on IP
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Find the stats document (there should be only one)
        let stats = await SiteStats.findOne();
        if (!stats) {
            stats = new SiteStats({ totalVisits: 0, uniqueVisitors: [] });
        }

        stats.totalVisits += 1;

        if (!stats.uniqueVisitors.includes(ip)) {
            stats.uniqueVisitors.push(ip);
        }

        await stats.save();
    } catch (error) {
        console.error("Tracking Error:", error);
        // Don't block the request if tracking fails
    }
    next();
};

module.exports = trackVisits;
