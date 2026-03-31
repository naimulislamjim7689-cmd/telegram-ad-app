const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    telegramId: { type: String, required: true, unique: true },
    username: String,
    balance: { type: Number, default: 0 },
    country: String,
    lastAdTime: { type: Date, default: Date.now }
});
module.exports = mongoose.model('User', UserSchema);