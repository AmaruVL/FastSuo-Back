const rutas_reportes = require("express").Router();

const resumen = require("../../../../controllers/reporte_resumen_total_fechas");
const empresas = require("../../../../controllers/empresa")
const oficinas = require("../../../../controllers/oficina");

rutas_reportes.get("/listar_empresas", empresas.listar);
rutas_reportes.get("/listar_oficinas", oficinas.listar);

rutas_reportes.post("/resumenorigen",resumen.resumen_origen);
rutas_reportes.post("/resumendestino",resumen.resumen_destino);

module.exports = rutas_reportes;