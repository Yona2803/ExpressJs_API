const express = require("express");
const Fichier = require("../../models/Files");

const router = express.Router();

// Define the route for downloading files
router.get("/", async (req, res) => {
    const { id_Msg, Type_Fichier } = req.body;

    // Validation
    if (!id_Msg || !Type_Fichier) {
        return res.status(400).json({ status: "Bad_Request" });
    }

    try {
        // Find the file record in MongoDB by Id_Msg and Type_Fichier
        const fileRecord = await Fichier.findOne({ Id_Msg: id_Msg, Type_Fichier: Type_Fichier });

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