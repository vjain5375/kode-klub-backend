const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Helper to get a setting value
SettingsSchema.statics.getSetting = async function (key, defaultValue = null) {
    const setting = await this.findOne({ key });
    return setting ? setting.value : defaultValue;
};

// Helper to set a setting value
SettingsSchema.statics.setSetting = async function (key, value) {
    return this.findOneAndUpdate(
        { key },
        { key, value, updatedAt: new Date() },
        { upsert: true, new: true }
    );
};

module.exports = mongoose.model('Settings', SettingsSchema);
