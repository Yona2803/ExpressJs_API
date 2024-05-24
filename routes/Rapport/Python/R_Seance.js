const { executeQuery } = require("../../../lib/db");
require("dotenv").config();
const express = require("express"),
    fs = require("fs"),
    mongoose = require("mongoose"),
    Fichier = require("../../../models/R_Seance"),
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



const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.fields([{ name: "IMG_1" }, { name: "IMG_2" }]), async (req, res) => {
    const { id_Seance, Timestamp_Generated } = req.body
    let VolT_1, VolT_2, DVolT, NomFishier;
    let IMG_1_Data, IMG_2_Data;
    try {
        // Validation
        if (!id_Seance || !Timestamp_Generated) {
            return res.status(400).json({ status: "Missing_fields" });
        }

        // File Check
        const IMG_1Exists = req.files['IMG_1'] ? true : false;
        const IMG_2Exists = req.files['IMG_2'] ? true : false;

        if (!IMG_1Exists || !IMG_2Exists) {
            return res.status(400).json({ status: "Missing_files" });
        }

        if (IMG_1Exists) {
            IMG_1_Data = (
                {
                    "File_Buffer": req.files['IMG_1'][0].buffer,
                    "File_MimeType": req.files['IMG_1'][0].mimetype,
                });
            console.log(IMG_1_Data["File_Buffer"]);
        }
        
        if (IMG_2Exists) {
            IMG_2_Data = (
                {
                    "File_Buffer": req.files['IMG_2'][0].buffer,
                    "File_MimeType": req.files['IMG_2'][0].mimetype,
                });
            console.log(IMG_2_Data);
        }

        // Python Call











        // Update or Insert to Seance
        VolT_1 = "10"
        VolT_2 = "9"
        DVolT = (VolT_2 - VolT_1)
        NomFishier = "ERT-RSÉANCE[" + id_Seance + "]"

        console.log({
            VolT_1: VolT_1,
            VolT_2: VolT_2,
            DVolT: DVolT,
            Timestamp_Generated: Timestamp_Generated,
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
