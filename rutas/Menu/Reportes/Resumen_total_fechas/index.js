const rutas_reportes = require("express").Router();

const empresas = require("../../../../controllers/empresa")
const oficinas = require("../../../../controllers/oficina");

rutas_reportes.get("/listar_empresas", empresas.listar);
rutas_reportes.get("/listar_oficinas", oficinas.listar);

module.exports = rutas_reportes;