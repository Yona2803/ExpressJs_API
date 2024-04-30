// i have schema in ../models/files 
const mongoose = require("mongoose");

const FichierSchema = new mongoose.Schema({
    Id_Msg: Number,
    Type_Fichier: String,
    file: {
        data: Buffer,
        contentType: String,
    }
});

// Create a Mongoose model based on the schema
module.exports = Fichier = mongoose.model("fichier", FichierSchema);
