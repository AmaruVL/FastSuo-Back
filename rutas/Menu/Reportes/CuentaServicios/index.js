const rutas_reportes = require("express").Router();

//const reportes = require("../../../../controllers/reportes");
const caja = require("../../../../controllers/caja");
const cuenta_corriente = require("../../../../controllers/cuenta_corriente");
const oficinas = require("../../../../controllers/oficina");
const reporteCuentaServicios = require("../../../../controllers/reporteCuentaServicios");

rutas_reportes.get("/listarcuentasservicios", cuenta_corriente.listarcuentasservicios);
rutas_reportes.get("/operaciones", reporteCuentaServicios.operacionesOficina);

module.exports = rutas_reportes;
