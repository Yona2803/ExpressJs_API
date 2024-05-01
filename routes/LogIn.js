const { executeQuery } = require("../lib/db");
const express = require("express");
const router = express.Router()
router.use(express.json());
router.use(express.urlencoded({extended:true}));

router.get("/", async (req, res) => {
    const { UserName_Employe, Password_Employe } = req.query;
    if (!UserName_Employe || !Password_Employe){
        return res.status(406).send("Il semble que certaines informations soient manquantes ou incorrectes. Veuillez examiner les champs en surbrillance et soumettre à nouveau.");
    }
    try {
        const Select_Records = await executeQuery({
            query: "SELECT `Num_Employe`, `Nom_Employe`, `Prenom_Employe`, `Password_Employe`, `Specialite` FROM `employes` WHERE UserName_Employe = ?",
            values: [UserName_Employe],
        });

        if (Select_Records.length !== 0) {
            // Check if Password_Employe matches
            const status = Select_Records.some(record => record.Password_Employe !== Password_Employe);
            if (status) {
                return res.json({ status: "Password" });
            } else {
                return res.json(Select_Records);
            }
        } else {
            return res.json({ status: "UserName" });
        }
    } catch (error) {
        console.error("Oops! Nous avons rencontré un problème lors de la récupération de vos données. Merci de réessayer dans quelques instants. Si le problème persiste, contactez notre équipe d'assistance pour obtenir de l'aide.");
        res.status(500).send("Nous rencontrons actuellement des difficultés pour nous connecter au serveur. Veuillez vérifier votre connexion Internet ou réessayer sous peu.");
    }
});

module.exports = router;
