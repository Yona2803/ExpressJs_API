const { executeQuery } = require("../../lib/db");
const express = require("express");

const router = express.Router()
router.use(express.json());
router.use(express.urlencoded({ extended: true }));


router.get("/General", async (req, res) => {
    const { id_Dossier } = req.query;
    // Validation
    if (!id_Dossier) {
        return res.status(400).json({ status: "Bad_Request" });
    }

    try {
        const Select_Records = await executeQuery({
            query: "SELECT * FROM Rapport_Dossier WHERE id_Dossier = ? ORDER BY id_Dossier ASC",
            values: [id_Dossier],
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

router.get("/Seance", async (req, res) => {
    const { id_Seance } = req.query;
    // Validation
    if (!id_Seance) {
        return res.status(400).json({ status: "Bad_Request" });
    }

    try {
        const Select_Records = await executeQuery({
            query: "SELECT Nom_Rapport, Timestamp_Generated, Volume_IMG1, Volume_IMG2, Difference_Volume FROM Seance WHERE id_Seance = ? LIMIT 1",
            values: [id_Seance],
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

router.get("/General_Info", async (req, res) => {
    const { id_Seance } = req.query;
    // Validation
    if (!id_Seance) {
        return res.status(400).json({ status: "Bad_Request" });
    }

    try {
        const Select_Records = await executeQuery({
            query: "SELECT Volume_IMG1, Volume_IMG2, Difference_Volume FROM Seance WHERE id_Seance = ? LIMIT 1",
            values: [id_Seance],
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
