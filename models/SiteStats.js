const mongoose = require('mongoose');

const SiteStatsSchema = new mongoose.Schema({
    totalVisits: {
        type: Number,
        default: 0
    },
    uniqueVisitors: {
        type: [String],
        default: []
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('WebsiteStats', SiteStatsSchema);
