const mongoose = require("mongoose");

const Schema = new mongoose.Schema({
    id_Dossier : Number,
    Nom_Rapport: String,
    file: {
        data: Buffer,
        contentType: String,
    }
});

// Create a Mongoose model based on the schema
module.exports = General = mongoose.model("General", Schema);
 