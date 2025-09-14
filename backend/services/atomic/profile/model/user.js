const { supabase } = require("../db/supabase");
const profileTable = "profiles";

module.exports = {

    async getAllUsers() {
        const { data, error } = await supabase
            .from(profileTable)
            .select('*')

        if (error) throw new Error(error.message);
        return data || [];
    },

}

