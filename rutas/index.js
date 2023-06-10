const rutas = require("express").Router();

const utils = require("../controllers/utils");
const mantenimientos = require("./Menu/Mantenimientos");
const configuracion = require("./Menu/Configuracion");
const logBody = require("../middleware/logBody");

//RUTAS MENU NIVEL 1
rutas.use("/configuracion", configuracion);
rutas.use("/mantenimientos", mantenimientos);
rutas.use(logBody());

//DOCUMENTOS
rutas.post("/salir", utils.cerrarSesion);
rutas.post("/salirmobil", utils.cerrarSesionMobil);

//RUTAS DIRECTAS

rutas.get("/", (req, res) => {
  res.status(200).json({
    municusco: "Plataforma V1.0",
  });
});

module.exports = rutas;
