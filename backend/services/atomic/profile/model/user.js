const { supabase } = require("../db/supabase");
const userTable = "user";

module.exports = {

    async getAllUsers() {
        const { data, error } = await supabase
            .from(userTable)
            .select('*')

        console.log(data)
        return data;
    },

}

