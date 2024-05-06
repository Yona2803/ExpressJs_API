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

module.exports = router;

