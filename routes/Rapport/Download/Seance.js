const express = require("express");
const R_Seance = require("../../../models/R_Seance");

const router = express.Router();

// Define the route for downloading files
router.get("/", async (req, res) => {
    const { id_Seance, Nom_Rapport } = req.body;

    // Validation
    if (!id_Seance || !Nom_Rapport) {
        return res.status(400).json({ status: "Bad_Request" });
    }

    try {
        // Find the file record in MongoDB by id_Seance and Nom_Rapport
        const fileRecord = await R_Seance.findOne({ id_Seance: id_Seance, Nom_Rapport: Nom_Rapport });

        if (!fileRecord) {
            return res.status(404).json({ error: "File not found" });
        }

        // Set the appropriate headers for file download
        res.set({
            "Content-Type": fileRecord.file.contentType,
            "Content-Disposition": `attachment; filename="${fileRecord.Id_Msg}.${fileRecord.Type_Fichier}"`,
        });

        // Send the file data as the response
        res.send(fileRecord.file.data);
    } catch (error) {
        console.error("Error downloading file:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;