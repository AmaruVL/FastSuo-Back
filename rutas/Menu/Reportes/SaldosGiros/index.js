const rutas_reportes = require("express").Router();

//const reportes = require("../../../../controllers/reporte_cuentas");
const reportes = require("../../../../controllers/reporte_resumen_saldos_giros");
const oficinas = require("../../../../controllers/oficina");

rutas_reportes.get("/listar_oficinas", oficinas.listar);
rutas_reportes.post("/", reportes.resumen_saldos_giros);

module.exports = rutas_reportes;
