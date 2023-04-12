const rutas_reportes = require("express").Router();
const oficinas = require("../../../../controllers/oficina");

const reportesrecibos = require("../../../../controllers/reporte_recibosInternos");

rutas_reportes.post("/", reportesrecibos.recibos);
rutas_reportes.get("/listar_oficinas", oficinas.listar);

module.exports = rutas_reportes;