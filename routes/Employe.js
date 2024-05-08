const { executeQuery } = require("../lib/db");
const express = require("express");
const router = express.Router()
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.get("/", async (req, res) => {
    const { Num_Employe } = req.query;
    if (!Num_Employe) {
        return res.status(406).send("Bad Request");
    }
    try {
        const Employe_Data = await executeQuery({
            query: "SELECT `Nom_Employe`, `Prenom_Employe`, `Specialite` FROM `employes` WHERE Num_Employe = ?",
            values: [Num_Employe],
        });

        return res.status(200).json(Employe_Data);
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});


router.get("/ComboBox", async (req, res) => {
    try {
        const Select_Techniciens = await executeQuery({
            query: "SELECT Num_Employe, Nom_Employe, Prenom_Employe FROM Employes WHERE Specialite = ?",
            values: ["Radiotherapeute"],
        });

        // Check if both arrays are empty
        const response = [];
        if (Select_Techniciens.length > 0) {
            response.push({ data: Select_Techniciens });
        } else {
            response.push({ data: "NoRecords" });
        }
        return res.json(response);
    } catch (error) {
        console.error("Issue with server:", error);
        return res.status(500).json({ status: "Server_Issue" });
    }
});
module.exports = router;

