const rutas_reportes = require("express").Router();

const rep_gerencial = require("../../../../controllers/reporte_gerencial");
const empresas = require("../../../../controllers/empresa")
const oficinas = require("../../../../controllers/oficina");

rutas_reportes.get("/listar_empresas", empresas.listar);
rutas_reportes.get("/listar_oficinas", oficinas.listar);

rutas_reportes.post("/detalleorigen",rep_gerencial.gerencial_origen);
rutas_reportes.post("/detalledestino",rep_gerencial.gerencial_destino);

module.exports = rutas_reportes;