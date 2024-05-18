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


router.post("/", async (req, res) => {
    const { Cin_Employe, Nom_Employe, Prenom_Employe, Date_Nais_Employe, Adresse_Employe, Ville_Employe, Num_Tel_Employe, Email_Employe, Date_Embauche_Employe, UserName_Employe, Password_Employe, Specialite, UserName_Admin, Password_Admin } = req.body;
    let newEmp_id;

    // Validation
    if (!Cin_Employe || !Nom_Employe || !Prenom_Employe || !Date_Nais_Employe || !Adresse_Employe || !Ville_Employe || !Num_Tel_Employe || !Email_Employe || !Date_Embauche_Employe || !UserName_Employe || !Password_Employe || !Specialite) {
        return res.status(400).json({ status: "New_Emp_Bad_Request" });
    }
    if (!UserName_Admin || !Password_Admin) {
        return res.status(400).json({ status: "Admin_Bad_Request" });
    }
    try {
        // Check the Admin info's
        const Check_Admin = await executeQuery({
            query: "SELECT Password_Employe, Specialite FROM `employes` WHERE UserName_Employe = ?",
            values: [UserName_Admin],
        });

        if (Check_Admin.length !== 0) {
            const Admin_Password = Check_Admin.some(record => record.Password_Employe !== Password_Admin);
            const Admin_Specialite = Check_Admin.some(record => record.Specialite !== "Secretaire");
            if (Admin_Specialite) {
                return res.json({ status: "Admin_Specialite" });
            } else if (Admin_Password) {
                return res.json({ status: "Admin_Password" });
            }
        } else {
            return res.json({ status: "Admin_UserName" });
        }

        // Check the Employe info's
        // Cin_Employe 
        const Check_Cin_Employe = await executeQuery({
            query: "SELECT Num_Employe  FROM employes WHERE Cin_Employe = ?",
            values: [Cin_Employe],
        });
        if (Check_Cin_Employe.length !== 0) {
            return res.status(400).json({ status: "Cin_Employe" });
        }

        // Nom_Employe  || Prenom_Employe
        const Check_Nom_Employe = await executeQuery({
            query: "SELECT Num_Employe  FROM employes WHERE Nom_Employe = ? AND Prenom_Employe = ?",
            values: [Nom_Employe, Prenom_Employe],
        });
        if (Check_Nom_Employe.length !== 0) {
            return res.status(400).json({ status: "Nom_Prenom" });
        }

        // Num_Tel_Employe  
        const Check_Num_Tel_Employe = await executeQuery({
            query: "SELECT Num_Employe  FROM employes WHERE Num_Tel_Employe = ?",
            values: [Num_Tel_Employe],
        });
        if (Check_Num_Tel_Employe.length !== 0) {
            return res.status(400).json({ status: "Num_Tel_Employe" });
        }

        // Email_Employe
        const Check_Email_Employe = await executeQuery({
            query: "SELECT Num_Employe  FROM employes WHERE Email_Employe = ?",
            values: [Email_Employe],
        });
        if (Check_Email_Employe.length !== 0) {
            return res.status(400).json({ status: "Email_Employe" });
        }

        // UserName_Employe || !Password_Employe
        const Check_Employe = await executeQuery({
            query: "SELECT Num_Employe FROM `employes` WHERE UserName_Employe = ?",
            values: [UserName_Employe],
        });
        if (Check_Employe.length !== 0) {
            return res.json({ status: "Employe_UserName" });
        }

        // Insert the Employe info's
        const MaxId_Records = await executeQuery({
            query: "SELECT MAX(Num_Employe) AS Max_Id FROM employes",
            values: [],
        });
        newEmp_id = (MaxId_Records[0].Max_Id || 0) + 1;
        await executeQuery({
            query: "INSERT INTO employes VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
            values: [newEmp_id, Cin_Employe, Nom_Employe, Prenom_Employe, Date_Nais_Employe, Adresse_Employe, Ville_Employe, Num_Tel_Employe, Email_Employe, Date_Embauche_Employe, UserName_Employe, Password_Employe, Specialite],
        });
        return res.status(201).json({ status: "Good", newEmp_id });
    } catch (error) {
        console.error("Issue with server");
        res.status(500).json({ status: "Server_Issue" });
    }
});

module.exports = router;

