// If using Supabase as DB:

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_API_KEY

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL and API Key must be set in the environment variables.");
  }

const supabase = createClient(supabaseUrl, supabaseKey)

module.exports = { supabase };