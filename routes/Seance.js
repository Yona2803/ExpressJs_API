const { executeQuery } = require("../lib/db");
const express = require("express");
const router = express.Router()
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.get("/", async (req, res) => {
    const { id_Dossier, Num_Tech, Num_Phy } = req.query;
    // Validation
    if ((!id_Dossier && !Num_Tech && !Num_Phy) || (!id_Dossier && (Num_Tech || Num_Phy))) {
        return res.status(400).json({ status: "Bad_Request" });
    }
    try {
        let URL, Check;
        if (id_Dossier && !Num_Tech && !Num_Phy) {
            URL = "SELECT id_Seance, Seance_Number, Fin_Seance, Num_Technicien, Num_Physicien FROM seance WHERE id_Dossier = ?";
            const Select_Records = await executeQuery({
                query: URL,
                values: [id_Dossier],
            });
            if (Select_Records.length !== 0) {
                return res.json(Select_Records);
            }
        }
        if (id_Dossier && Num_Tech && !Num_Phy) {
            URL = "SELECT id_Seance, Seance_Number, Fin_Seance, Num_Technicien, Num_Physicien FROM seance WHERE id_Dossier = ? AND Num_Technicien = ?";
            const Select_Records = await executeQuery({
                query: URL,
                values: [id_Dossier, Num_Tech],
            });
            if (Select_Records.length !== 0) {
                return res.json(Select_Records);
            }
        }
        if (id_Dossier && !Num_Tech && Num_Phy) {
            URL = "SELECT id_Seance, Seance_Number, Fin_Seance, Num_Technicien, Num_Physicien FROM seance WHERE id_Dossier = ? AND Num_Physicien = ?";
            const Select_Records = await executeQuery({
                query: URL,
                values: [id_Dossier, Num_Phy],
            });
            if (Select_Records.length !== 0) {
                return res.json(Select_Records);
            }
        }
        return res.json({ status: "NoRecords" });
    } catch (error) {
        console.error("Issue with server");
        res.status(500).json({ status: "Server_Issue" });
    }
});


router.get("/ComboBox", async (req, res) => {
    try {
        const Select_Physiciens = await executeQuery({
            query: "SELECT Num_Employe, Nom_Employe, Prenom_Employe FROM Employes WHERE Specialite = ?",
            values: ["Physicien"],
        });

        const Select_Techniciens = await executeQuery({
            query: "SELECT Num_Employe, Nom_Employe, Prenom_Employe FROM Employes WHERE Specialite = ?",
            values: ["Technicien"],
        });

        // Check if both arrays are empty

        const response = [];
        if (Select_Physiciens.length > 0) {
            response.push({ status: "Physicien", data: Select_Physiciens });
        } else {
            response.push({ status: "Physicien", data: "NoRecords" });
        }
        if (Select_Techniciens.length > 0) {
            response.push({ status: "Technicien", data: Select_Techniciens });
        } else {
            response.push({ status: "Technicien", data: "NoRecords" });
        }
        return res.json(response);

    } catch (error) {
        console.error("Issue with server:", error);
        return res.status(500).json({ status: "Server_Issue" });
    }
});





router.post("/", async (req, res) => {
    const { id_Dossier, Num_Technicien, Num_Physicien } = req.body;
    let newSeanceId, newSeance_Number;

    // Validation
    if (!id_Dossier || !Num_Technicien || !Num_Physicien) {
        return res.status(400).json({ status: "Bad_Request" });
    }
    try {
        // check the request
        const Chech_Dossier = await executeQuery({
            query: "SELECT id_Dossier FROM dossiers WHERE id_Dossier = ?;",
            values: [id_Dossier],
        });
        if (Chech_Dossier.length === 0) {
            return res.status(400).json({ status: "Dossier" });
        }

        const Chech_Technicien = await executeQuery({
            query: "SELECT Num_Employe FROM Employes WHERE Num_Employe = ? AND Specialite = ?",
            values: [Num_Technicien, "Technicien"],
        });
        if (Chech_Technicien.length === 0) {
            return res.status(400).json({ status: "Technicien" });
        }

        const Chech_Physicien = await executeQuery({
            query: "SELECT Num_Employe FROM Employes WHERE Num_Employe = ? AND Specialite = ?",
            values: [Num_Physicien, "Physicien"],
        });
        if (Chech_Physicien.length === 0) {
            return res.status(400).json({ status: "Physicien" });
        }
        
        // Add new Seance
        const Seance_MaxId = await executeQuery({
            query: "SELECT MAX(id_Seance) AS Max_Id FROM Seance",
            values: [],
        });
        newSeanceId = (Seance_MaxId[0].Max_Id || 0) + 1;

        const Seance_Number = await executeQuery({
            query: "SELECT MAX(Seance_Number) AS Max_Id FROM Seance WHERE id_Dossier= ?",
            values: [id_Dossier],
        });
        newSeance_Number = (Seance_Number[0].Max_Id || 0) + 1;

        // Check for Updates
        if (Seance_Number.length !== 0) {
            await executeQuery({
                query: "UPDATE Seance SET Fin_Seance = ? WHERE Seance_Number = ?",
                values: [true, (Seance_Number[0].Max_Id)],
            });
        }

        // INSERT Query
        await executeQuery({
            query: "INSERT INTO Seance VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            values: [newSeanceId, newSeance_Number, null, null,null, null,null, false, false, id_Dossier, Num_Technicien, Num_Physicien],
        });

        return res.status(201).json({ status: "Good" });
    } catch (error) {
        console.error("Issue with server");
        res.status(500).json({ status: "Server_Issue" });
    }
});

module.exports = router;
