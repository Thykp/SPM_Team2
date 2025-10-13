// Fetch & update user notification preferences
// const supabase = require('@supabase/supabase-js');
const axios = require('axios');
KONG_URL = "http://kong:8000"

async function getPreferences(userId) {
    try {
        const res = await axios.get(`${KONG_URL}/profile/user/${userId}/notifications/preferences`);
        return res.data.notification_delivery || [];
    } catch (err) {
        if (err.response && err.response.status === 404) return null;
        throw new Error('Failed to fetch notification preferences: ' + err.message);
    }
}

async function updatePreferences(userId, notification_preferences) {
    try {
        const res = await axios.put(
        `${KONG_URL}/profile/user/${userId}/notifications/preferences`, { notification_preferences });
        return res.data.notification_delivery || [];
    } catch (err) {
        throw new Error('Failed to update notification preferences: ' + err.message);
    }
}

module.exports = { getPreferences, updatePreferences };
