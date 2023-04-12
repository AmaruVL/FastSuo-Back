const rutas_reportes = require("express").Router();

const reportes = require("../../../../controllers/reportes");
const resumen_caja = require("../../../../controllers/reporte_resumen_saldos")

rutas_reportes.get("/", reportes.resumen_saldos);
rutas_reportes.get("/cajas",resumen_caja.resumen_saldos_caja);

module.exports = rutas_reportes;