const rutas = require("express").Router();
const contrasena = require("./Contrasena");
//SUBRUTAS
rutas.use("/cambiarcontrasena", contrasena);

//RUTAS DIRECTAS

module.exports = rutas;
