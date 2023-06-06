const rutas_reportes = require("express").Router();

//const reportes = require("../../../../controllers/reportes");
const caja = require("../../../../controllers/caja");
const oficinas = require("../../../../controllers/oficina");
const reporteCuentaServicios = require("../../../../controllers/reporteCuentaServicios");

rutas_reportes.get("/operaciones", reporteCuentaServicios.operacionesOficina);

module.exports = rutas_reportes;
