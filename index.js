require("dotenv").config();
const express = require('express');
const app = express()

const cors = require('cors');
app.use(cors(
  {
    "allowedheaders":"*",
  "origin": "*",
  "allowMethods": "*",
}
));

app.use(express.json());
app.use(express.urlencoded({extended:true}));

const LogIn = require("./routes/LogIn");
app.use("/LogIn", LogIn);
const Employe = require("./routes/Employe");
app.use("/Employe", Employe);
const Dossier = require("./routes/Dossier");
app.use("/Dossier", Dossier);
const Seance = require("./routes/Seance");
app.use("/Seance", Seance);
const Message = require("./routes/Messages/Message");
app.use("/Message", Message);
const Download = require("./routes/Messages/Download");
app.use("/Message/Download", Download);
const Rapport_General = require("./routes/Rapport/Get_All_Rapport");
app.use("/Rapport", Rapport_General);
const Seance_list = require("./routes/Rapport/Seance_list");
app.use("/Rapport/Seance_list", Seance_list);
//Download Rapport
const R_General = require("./routes/Rapport/Download/General");
app.use("/Rapport/R_General", R_General);
const R_Seance = require("./routes/Rapport/Download/Seance");
app.use("/Rapport/R_Seance", R_Seance);

app.listen(process.env.PUBLIC_PORT, () => {
  console.log(`listening on port ${process.env.PUBLIC_PORT}`)
});
