const rutas_reportes = require("express").Router();

//const reportes = require("../../../../controllers/reportes");
const caja = require("../../../../controllers/caja");
const oficinas = require("../../../../controllers/oficina");
const reporteCuentaCorriente = require("../../../../controllers/reporteCuentaCorriente");

rutas_reportes.get("/operaciones", reporteCuentaCorriente.operacionesOficina);
rutas_reportes.get("/operacionespdf", reporteCuentaCorriente.descargarPDF);

module.exports = rutas_reportes;
