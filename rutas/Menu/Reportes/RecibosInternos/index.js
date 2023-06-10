const rutas_reportes = require("express").Router();
const oficinas = require("../../../../controllers/oficina");

rutas_reportes.get("/listar_oficinas", oficinas.listar);

module.exports = rutas_reportes;