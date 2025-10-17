// Fetch & update user notification preferences
// const supabase = require('@supabase/supabase-js');
const axios = require('axios');
KONG_URL = "http://kong:8000"

async function getDeliveryPreferences(userId) {
    try{
        const response = await axios.get(`${KONG_URL}/notifications/preferences/delivery-method/${userId}`)
        return response.data
    }
    catch(error){
        throw new Error(
            `Failed to fetch notification delivery preferences: ${JSON.stringify(error.response?.data || error.message)}`
        );
    }
}

async function updateDeliveryPreferences(userId, delivery_method) {
    try{
        await axios.put(`${KONG_URL}/notifications/preferences/delivery-method/${userId}`, { delivery_method });
    } catch (err) {
        throw new Error('Failed to update notification delivery preferences: ' + err.message);
    }
}

async function getFrequencyPreferences(userId) {
    try{
        const response = await axios.get(`${KONG_URL}/notifications/preferences/frequency/${userId}`)
        return response.data
    }
    catch(error){
        throw new Error(
            `Failed to fetch notification frequency preferences: ${JSON.stringify(error.response?.data || error.message)}`
        );
    }
}


async function updateFrequencyPreferences(userId, frequency) {
    try{
        await axios.patch(`${KONG_URL}/notifications/preferences/frequency/${userId}`, {
            delivery_frequency: frequency.delivery_frequency,
            delivery_time: frequency.delivery_time || "1970-01-01T09:00:00+00:00",
            delivery_day: frequency.delivery_day || "Monday",
        });
    } catch (err) {
        throw new Error('Failed to update notification frequency preferences: ' + err.message);
    }
}

module.exports = { 
    getDeliveryPreferences,
    updateDeliveryPreferences,
    getFrequencyPreferences,
    updateFrequencyPreferences
};
