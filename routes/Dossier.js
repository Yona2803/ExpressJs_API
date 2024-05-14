const { executeQuery } = require("../lib/db");
const express = require("express");
const router = express.Router()
router.use(express.json());
router.use(express.urlencoded({ extended: true }));


router.get("/", async (req, res) => {
    const { Num_Employe, Num_Tech, Num_Phy } = req.query;
    // Validation
    if (!Num_Employe && !Num_Tech && !Num_Phy) {
        return res.status(400).json([{ status: "Bad_Request" }]);
    }
    try {

        if (Num_Employe && !Num_Tech && !Num_Phy) {
            const Select_Records = await executeQuery({
                query: "SELECT * FROM dossier_select WHERE Num_Employe = ?",
                values: [Num_Employe],
            });
            if (Select_Records.length !== 0) {
                return res.json(Select_Records);
            } else {
                return res.json([{ status: "NoRecords" }]);
            }
        }
        if (Num_Employe && Num_Tech) {
            const Select_Records = await executeQuery({
                query: "SELECT * FROM dossier_select WHERE Num_Technicien = ? AND Num_Employe = ?",
                values: [Num_Tech, Num_Employe],
            });
            if (Select_Records.length !== 0) {
                return res.json(Select_Records);
            } else {
                return res.json([{ status: "NoRecords" }]);
            }
        }

        if (Num_Employe && Num_Phy) {
            const Select_Records = await executeQuery({
                query: "SELECT * FROM dossier_select WHERE Num_Physicien = ? AND Num_Employe = ?",
                values: [Num_Phy,Num_Employe],
            });
            if (Select_Records.length !== 0) {
                return res.json(Select_Records);
            } else {
                return res.json([{ status: "NoRecords" }]);
            }
        }
                return res.json([{ status: "NoRecords" }]);
    } catch (error) {
        console.error("Issue with server");
        res.status(500).json([{ status: "Server_Issue" }]);
    }
});



router.post("/", async (req, res) => {
    const { Num_Employe, Nom_Patient, Prenom_Patient, Date_Nais_Patient, Email_Patient, Num_Tel_Patient, Adresse_Patient } = req.body;
    let newPatientId, newDossierId;

    // Validation
    if (!Num_Employe || !Nom_Patient || !Prenom_Patient || !Date_Nais_Patient || !Email_Patient || !Num_Tel_Patient || !Adresse_Patient) {
        return res.status(400).json({ status: "Bad_Request" });
    }
    try {
        // Add new Patient
        const Patient_MaxId = await executeQuery({
            query: "SELECT MAX(id_Patient) AS Max_Id FROM patients",
            values: [],
        });
        newPatientId = (Patient_MaxId[0].Max_Id || 0) + 1;

        await executeQuery({
            query: "INSERT INTO patients VALUES (?,?,?,?,?,?,?)",
            values: [newPatientId, Nom_Patient, Prenom_Patient, Date_Nais_Patient, Email_Patient, Num_Tel_Patient, Adresse_Patient],
        });

        // Add Dossier of the new Patient
        const Dossier_MaxId = await executeQuery({
            query: "SELECT MAX(id_Dossier) AS Max_Id FROM dossiers",
            values: [],
        });
        newDossierId = (Dossier_MaxId[0].Max_Id || 0) + 1;

        await executeQuery({
            query: "INSERT INTO dossiers VALUES (?,?,?)",
            values: [newDossierId, Num_Employe, newPatientId],
        });

        return res.status(201).json({ status: "Good", newPatientId, newDossierId });
    } catch (error) {
        console.error("Issue with server");
        res.status(500).json({ status: "Server_Issue" });
    }
});

module.exports = router;
