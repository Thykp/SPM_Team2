const { supabase } = require("../db/supabase");
const profileTable = "profiles";

module.exports = {

    async getAllUsers() {
        const { data } = await supabase
            .from(profileTable)
            .select('*')

        console.log(data)
        return data;
    },

}

