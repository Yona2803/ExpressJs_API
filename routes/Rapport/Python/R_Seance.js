const { executeQuery } = require("../../../lib/db");
require("dotenv").config();
const express = require("express"),
    fs = require("fs"),
    mongoose = require("mongoose"),
    Fichier = require("../../../models/R_Seance"),
    multer = require("multer"),
    path = require("path"),
    os = require("os");

const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

const { spawn } = require('child_process');

const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.fields([{ name: "IMG_1" }, { name: "IMG_2" }]), async (req, res) => {
    const { id_Seance, Timestamp_Generated, id_Patient } = req.body;
    const Nom_Rapport = `ERT-SÉANCE[${id_Seance}]`
    let userInfo;
    if (!id_Seance || !Timestamp_Generated || !id_Patient) {
        return res.status(400).json({ status: "Missing_fields" });
    }

    const Select_Records = await executeQuery({
        query: "SELECT Nom_Patient, Prenom_Patient, Date_Nais_Patient  FROM patients WHERE id_Patient = ? ",
        values: [id_Patient],
    });
    if (Select_Records.length !== 0) {
        const dateOfBirth = new Date(Select_Records[0]["Date_Nais_Patient"]).toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' });
        userInfo = [Select_Records[0]["Nom_Patient"], Select_Records[0]["Prenom_Patient"], dateOfBirth];
    } else {
        return res.json([{ status: "NoRecords" }]);
    }

    const IMG_1 = req.files['IMG_1'] ? req.files['IMG_1'][0] : null;
    const IMG_2 = req.files['IMG_2'] ? req.files['IMG_2'][0] : null;

    if (!IMG_1 || !IMG_2) {
        return res.status(400).json({ status: "Missing_files" });
    }

    const tempDir = os.tmpdir();
    const IMG_1Path = path.join(tempDir, IMG_1.originalname);
    const IMG_2Path = path.join(tempDir, IMG_2.originalname);

    fs.writeFileSync(IMG_1Path, IMG_1.buffer);
    fs.writeFileSync(IMG_2Path, IMG_2.buffer);

        const dateCreated = new Date(Timestamp_Generated).toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' });
        const pythonProcess = spawn('python', ['./routes/Rapport/Python/Seance_Code.py', IMG_1Path, IMG_2Path, id_Patient, id_Seance, userInfo[2],dateCreated]);

    let outputData = '';

    pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python error: ${data.toString()}`);
        res.status(500).json({ status: "Server_Issue", error: data.toString() });
    
        // Remove files only after ensuring the response has not been sent
        if (fs.existsSync(IMG_1Path)) fs.unlinkSync(IMG_1Path);
        if (fs.existsSync(IMG_2Path)) fs.unlinkSync(IMG_2Path);
        return; // Ensure no further code is executed
    });
    

    pythonProcess.on('close', async (code) => {
        console.log(`Python process exited with code ${code}`);
    
        const [delta_vol, vol_1, vol_2, pdf_path] = outputData.split(',');
        console.log(delta_vol +" -|- "+ vol_1 +" -|- "+ vol_2 +" -|- "+ pdf_path)
        const pdfPath = pdf_path.trim();
    
        if (!pdfPath) {
            if (!res.headersSent) {
                res.status(500).json({ status: "Server_Issue", error: "PDF path not generated." });
            }
            return;
        }
    
        try {
            if (!fs.existsSync(pdfPath)) {
                console.error(`PDF file not found at path: ${pdfPath}`);
                if (!res.headersSent) {
                    res.status(500).json({ status: "Server_Issue", error: "PDF file not found." });
                }
                return;
            }
    
            const PDF_buffer = fs.readFileSync(pdfPath);
            console.log(`PDF Buffer Length: ${PDF_buffer.length}`);
    
            const existingFile = await Fichier.findOne({ id_Seance });
    
            if (existingFile) {
                console.log("file exist // " + id_Seance + " -|-" + Nom_Rapport)
                existingFile.file.data = PDF_buffer;
                existingFile.file.contentType = "application/pdf";
                await existingFile.save();
            } else {
                console.log("file not exist // " + id_Seance + " -|-" + Nom_Rapport)
                const newFile = new Fichier({
                    id_Seance: id_Seance,
                    Nom_Rapport: Nom_Rapport,
                    file: {
                        data: PDF_buffer,
                        contentType: "application/pdf"
                    }
                });
                await newFile.save();
            }
    
            await saveFile(id_Seance, Nom_Rapport, vol_1, vol_2, delta_vol, Timestamp_Generated);
    
            if (!res.headersSent) {
                res.status(200).json({
                    VolT_1: parseFloat(vol_1),
                    VolT_2: parseFloat(vol_2),
                    DVolT: parseFloat(delta_vol),
                    Timestamp_Generated,
                    NomFishier: `ERT-SÉANCE[${id_Seance}]`,
                    PDF_buffer: PDF_buffer.toString('base64'),
                });
            }
    
            if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
            if (fs.existsSync(IMG_1Path)) fs.unlinkSync(IMG_1Path);
            if (fs.existsSync(IMG_2Path)) fs.unlinkSync(IMG_2Path);
        } catch (error) {
            console.error(`Error processing PDF file: ${error}`);
            if (!res.headersSent) {
                res.status(500).json({ status: "Server_Issue", error: "Failed to process PDF file." });
            }
        }
    });
    
});

async function saveFile(id_Seance, Nom_Rapport, Volume_IMG1, Volume_IMG2, Difference_Volume, Timestamp_Generated) {
    try {
        await executeQuery({
            query: "UPDATE `seance` SET Nom_Rapport = ?, Volume_IMG1 = ?, Volume_IMG2 = ?, Difference_Volume = ?, Timestamp_Generated = ?, Rapport_Exist= true WHERE id_Seance = ?",
            values: [Nom_Rapport, Volume_IMG1, Volume_IMG2, Difference_Volume, Timestamp_Generated, id_Seance],
        });
    } catch (error) {
        console.error("Error saving file to MongoDB:", error);
        throw error;
    }
};

router.get("/", async (req, res) => {
    const { id_Seance, Nom_Rapport } = req.query;
    if (!id_Seance || !Nom_Rapport) {
        return res.status(400).json({ status: "Bad_Request" });
    }
    try {
        const fileRecord = await Fichier.findOne({ id_Seance: id_Seance, Nom_Rapport: Nom_Rapport });
        if (!fileRecord) {
            return res.status(404).json({ error: "File not found" });
        }
        res.set({
            "Content-Type": fileRecord.file.contentType,
            "Content-Disposition": `attachment; filename="${fileRecord.Id_Msg}.${fileRecord.Type_Fichier}"`,
        });
        res.send(fileRecord.file.data);
    } catch (error) {
        console.error("Error downloading file:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;