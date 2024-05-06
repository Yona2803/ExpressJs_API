const { executeQuery } = require("../../lib/db");
const express = require("express"),
    fs = require("fs"),
    mongoose = require("mongoose"),
    Fichier = require("../../models/Files"),
    multer = require("multer");

const router = express.Router()
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

mongoose.connect("mongodb+srv://aa7860_pfe:myApp_159753@file.jttco2n.mongodb.net/?retryWrites=true&w=majority&appName=File")
    .then(() => {
        console.log("Connected to MongoDB Successfully");
    }).catch((error) => {
        console.log("Error occurred while connecting to MongoDB: ", error);
    });



const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.fields([{ name: "PDF" }, { name: "DICOM" }]), async (req, res) => {
    const { id_Seance, Envoyeur_Msg, Destinataire_Msg, Text_Msg, Timestamp_Generated } = req.body
    let newId_Msg;

    try {
        // Validation
        if (!id_Seance || !Envoyeur_Msg || !Destinataire_Msg || !Text_Msg || !Timestamp_Generated) {
            return res.status(400).json({ status: "Bad_Request" });
        }

        if (Envoyeur_Msg !== Destinataire_Msg) {
            const Check_Envoyeur_Msg = await executeQuery({
                query: "SELECT Num_Employe FROM Employes WHERE Num_Employe = ?",
                values: [Envoyeur_Msg],
            });
            if (Check_Envoyeur_Msg.length === 0) {
                return res.status(400).json({ status: "Envoyeur_Msg" });
            }
            const Check_Destinataire_Msg = await executeQuery({
                query: "SELECT Num_Employe FROM Employes WHERE Num_Employe = ?",
                values: [Destinataire_Msg],
            });
            if (Check_Destinataire_Msg.length === 0) {
                return res.status(400).json({ status: "Destinataire_Msg" });
            }
        } else {
            return res.status(400).json({ status: "Bad_Request" });
        }

        // File Check
        const PDFExists = req.files['PDF'] ? true : false;
        const DICOMExists = req.files['DICOM'] ? true : false;

        // Add messages
        const Msg_MaxId = await executeQuery({
            query: "SELECT MAX(id_Msg) AS Max_Id_Msg FROM messages",
            values: [],
        });
        newId_Msg = (Msg_MaxId[0].Max_Id_Msg || 0) + 1;

        await executeQuery({
            query: "INSERT INTO messages VALUES (?,?,?,?,?,?,?,?)",
            values: [newId_Msg, Envoyeur_Msg, Destinataire_Msg, Text_Msg, DICOMExists, PDFExists, Timestamp_Generated, id_Seance,],
        });

        // if PDF = true then Add file data to MongoDB
        if (PDFExists) {
            await saveFileToMongoDB(newId_Msg, req.files['PDF'][0].buffer, req.files['PDF'][0].mimetype, "PDF");
        }

        // if DICOM = true then Add file data to MongoDB
        if (DICOMExists) {
            await saveFileToMongoDB(newId_Msg, req.files['DICOM'][0].buffer, req.files['DICOM'][0].mimetype, "DICOM");
        }

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
        // Save the file to MongoDB
        await newFile.save();
    } catch (error) {
        console.error("Error saving file to MongoDB:", error);
        throw error; // Rethrow the error for proper error handling in the calling function
    }
};


router.get("/", async (req, res) => {
    const { id_Seance, User_id_1, User_id_2 } = req.body;
    // Validation
    if (!id_Seance || !User_id_1 || !User_id_2) {
        return res.status(400).json({ status: "Bad_Request" });
    }
    if (User_id_1 === User_id_2) {
        return res.status(400).json({ status: "Bad_Request" });
    }
    try {
        const Select_Records = await executeQuery({
            query: "SELECT * FROM messages WHERE (id_Seance = ? AND Envoyeur_Msg = ? AND Destinataire_Msg = ?) OR (id_Seance = ? AND Envoyeur_Msg = ? AND Destinataire_Msg = ?) ORDER BY id_Msg AND Timestamp_Generated DESC",
            values: [id_Seance, User_id_1, User_id_2, id_Seance, User_id_2, User_id_1,],
        });

        if (Select_Records.length !== 0) {
            return res.json(Select_Records);
        } else {
            return res.json({ status: "NoRecords" });
        }
    } catch (error) {
        console.error("Issue with server");
        res.status(500).json({ status: "Server_Issue" });
    }
});

module.exports = router;
