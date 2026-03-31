const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Schema
const UserSchema = new mongoose.Schema({
    telegramId: String,
    username: String,
    balance: { type: Number, default: 0 },
    lastAdTime: { type: Date, default: Date.now },
    country: String
});
const User = mongoose.model('User', UserSchema);

mongoose.connect(process.env.MONGO_URI);

// Validate Telegram Data
function validateInitData(initData) {
    const encoded = decodeURIComponent(initData);
    const secret = crypto.createHmac('sha256', 'WebAppData').update(process.env.BOT_TOKEN).digest();
    const arr = encoded.split('&').filter(x => !x.startsWith('hash=')).sort();
    const dataCheckString = arr.join('\n');
    const _hash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
    return encoded.includes(`hash=${_hash}`);
}

// Check IP/Country Middleware
const checkGeo = async (req, res, next) => {
    try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const geo = await axios.get(`http://ip-api.com/json/${ip}`);
        if (geo.data.countryCode === 'BD' || geo.data.countryCode === 'IN') {
            req.userCountry = geo.data.countryCode;
            next();
        } else {
            res.status(403).json({ message: "Not available in your country" });
        }
    } catch (e) { next(); }
};

// Login Route
app.post('/api/login', checkGeo, async (req, res) => {
    const { initData } = req.body;
    if (!validateInitData(initData)) return res.status(401).send("Unauthorized");

    const params = new URLSearchParams(initData);
    const tgUser = JSON.parse(params.get('user'));

    let user = await User.findOne({ telegramId: tgUser.id });
    if (!user) {
        user = await User.create({ telegramId: tgUser.id, username: tgUser.username, country: req.userCountry });
    }
    res.json(user);
});

// Reward Route
app.post('/api/reward', async (req, res) => {
    const { initData } = req.body;
    if (!validateInitData(initData)) return res.status(401).send();

    const params = new URLSearchParams(initData);
    const tgUser = JSON.parse(params.get('user'));
    
    const user = await User.findOne({ telegramId: tgUser.id });
    const now = new Date();
    
    // Anti-cheat: Check if 15 seconds actually passed
    if ((now - user.lastAdTime) / 1000 < 14) return res.status(400).send("Wait for ad");

    user.balance += 10;
    user.lastAdTime = now;
    await user.save();
    res.json({ balance: user.balance });
});

app.listen(process.env.PORT, () => console.log("Backend Live"));