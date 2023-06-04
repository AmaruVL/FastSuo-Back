const rutas_cuentas = require("express").Router();
const cuenta = require("../../../../controllers/cuenta");
const verificarPerfil = require("../../../../middleware/verificarPerfil");

rutas_cuentas.get("/listar/cuentas/activas", [verificarPerfil(3)], cuenta.listarActivas);

module.exports = rutas_cuentas;
