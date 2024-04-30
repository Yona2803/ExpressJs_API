const { executeQuery } = require("../../lib/db");
const express = require("express");

const router = express.Router()
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.get("/", async (req, res) => {
    const { id_Dossier } = req.body;
    // Validation
    if (!id_Dossier) {
        return res.status(400).json({ status: "Bad_Request" });
    }
    try {
        const Select_Records = await executeQuery({
            query: "SELECT id_Seance, Seance_Number, Fin_Seance FROM seance WHERE id_Dossier = ? AND Rapport_Exist= true",
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