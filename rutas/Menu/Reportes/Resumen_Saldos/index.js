const rutas_reportes = require("express").Router();

const reportes = require("../../../../controllers/reportes");

rutas_reportes.get("/", reportes.resumen_saldos);
rutas_reportes.get("/saldos2/:opcion",reportes.resumen_saldos2);
rutas_reportes.get("/resumenpdf/:opcion",reportes.listaresumensaldos);

module.exports = rutas_reportes;