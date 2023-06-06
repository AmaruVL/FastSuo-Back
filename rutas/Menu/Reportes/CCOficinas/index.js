const rutas_reportes = require("express").Router();
const reporteCC = require("../../../../controllers/reporte_cc_oficinas");

// rutas_reportes.get("/listar_oficinas", reporteCC.listar_oficinas);
rutas_reportes.post("/", reporteCC.cc_oficinas);

module.exports = rutas_reportes;