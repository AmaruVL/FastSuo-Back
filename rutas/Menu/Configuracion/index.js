const rutas = require("express").Router();
const datos = require("./Datos");
const contrasena = require("./Contrasena");
//SUBRUTAS
rutas.use("/cambiarcontrasena", contrasena);
rutas.use("/datos", datos);

//RUTAS DIRECTAS

module.exports = rutas;
