const { executeQuery } = require("../../lib/db");
const express = require("express");

const router = express.Router()
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.get("/", async (req, res) => {
    const { id_Dossier } = req.query;
    // Validation
    if (!id_Dossier) {
        return res.status(400).json({ status: "Bad_Request" });
    }
    try {
        const Select_Records = await executeQuery({
            query: "SELECT id_Seance, Seance_Number, Nom_Rapport, Timestamp_Generated FROM Seance WHERE id_Dossier = ? AND Rapport_Exist = true ORDER BY id_Seance ASC ",
        //    query: "SELECT id_Seance, Seance_Number, Nom_Rapport, Timestamp_Generated, Volume_IMG1, Volume_IMG2, Difference_Volume FROM Seance WHERE id_Dossier = ? AND Rapport_Exist = true ORDER BY id_Seance ASC ",
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

module.exports = router;
