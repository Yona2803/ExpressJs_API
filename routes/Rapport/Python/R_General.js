const { executeQuery } = require("../../../lib/db");
require("dotenv").config();
const express = require("express"),
    fs = require("fs"),
    mongoose = require("mongoose"),
    Fichier = require("../../../models/R_General"),
    multer = require("multer");

const router = express.Router()
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_DB)
    .then(() => {
        console.log("Connected to MongoDB Successfully");
    }).catch((error) => {
        console.log("Error occurred while connecting to MongoDB: ", error);
    });


router.post("/", async (req, res) => {
    const { id_Dossier, To_Seance, Timestamp_Generated } = req.query
    let NomFishier;

    try {
        // Validation
        if (!id_Dossier || !To_Seance || !Timestamp_Generated) {
            return res.status(400).json({ status: "Missing_fields" });
        }

        const Values = await executeQuery({
            query: "SELECT Seance_Number, Volume_IMG1, Volume_IMG2, Difference_Volume FROM seance WHERE id_Dossier  = ? AND Rapport_Exist = true",
            values: [id_Dossier],
        });

        if (Values.length === 0) {
            return res.json({ status: "No_Seance" });
        }

        console.log({ "first file": Values[0] });

        // Python Call


        // Insert to rapport_dossier
        NomFishier = "ERT-RGÉNÉRAL[" + id_Dossier + "]"

        console.log({
            Timestamp_Generated,
            NomFishier
        });

        return res.json({ status: "Good" });
    } catch (error) {
        console.error("Issue with server : " + error);
        res.status(500).json({ status: "Server_Issue : " + error });
    }
});

async function saveFileToMongoDB(newId_Msg, fileData, contentType, fileType) {
    try {
        // Create a new files instance
        const newFile = new Fichier({
            Id_Msg: newId_Msg,
            Type_Fichier: fileType,
            file: {
                data: fileData,
                contentType: contentType
            }
        });
        // await newFile.save();
    } catch (error) {
        console.error("Error saving file to MongoDB:", error);
        throw error; // Rethrow the error for proper error handling in the calling function
    }
};

module.exports = router;
