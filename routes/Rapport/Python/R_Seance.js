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

mongoose.connect(process.env.MONGO_DB)
    .then(() => {
        console.log("Connected to MongoDB Successfully");
    }).catch((error) => {
        console.log("Error occurred while connecting to MongoDB: ", error);
    });

const { spawn } = require('child_process');

const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.fields([{ name: "IMG_1" }, { name: "IMG_2" }]), async (req, res) => {
    const { id_Seance, Timestamp_Generated } = req.body;

    if (!id_Seance || !Timestamp_Generated) {
        return res.status(400).json({ status: "Missing_fields" });
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

    const pythonProcess = spawn('python', ['./routes/Rapport/Python/Seance_Code.py', IMG_1Path, IMG_2Path]);

    pythonProcess.stdout.on('data', async (data) => {
        const output = data.toString();
        const [delta_vol, vol_1, vol_2] = output.split(',').map(parseFloat);

        await saveFile(id_Seance, `ERT-SÉANCE[${id_Seance}]`, vol_1, vol_2, delta_vol, Timestamp_Generated);

        res.status(200).json({
            VolT_1: vol_1,
            VolT_2: vol_2,
            DVolT: delta_vol,
            Timestamp_Generated,
            NomFishier: `ERT-SÉANCE[${id_Seance}]`
        });

        fs.unlinkSync(IMG_1Path);
        fs.unlinkSync(IMG_2Path);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python error: ${data.toString()}`);
        res.status(500).json({ status: "Server_Issue", error: data.toString() });

        if (fs.existsSync(IMG_1Path)) fs.unlinkSync(IMG_1Path);
        if (fs.existsSync(IMG_2Path)) fs.unlinkSync(IMG_2Path);
    });

    pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
    });
    return
});

async function saveFile(id_Seance, Nom_Rapport, Volume_IMG1, Volume_IMG2, Difference_Volume, Timestamp_Generated) {
    try {
        await executeQuery({
            query: "UPDATE `seance` SET Nom_Rapport = ?, Volume_IMG1 = ?, Volume_IMG2 = ?, Difference_Volume = ?, Timestamp_Generated = ?, Rapport_Exist= true WHERE id_Seance  = ?",
            values: [Nom_Rapport, Volume_IMG1, Volume_IMG2, Difference_Volume, Timestamp_Generated, id_Seance,],
        });

    } catch (error) {
        console.error("Error saving file to MongoDB:", error);
        throw error;
    }
};

module.exports = router;
