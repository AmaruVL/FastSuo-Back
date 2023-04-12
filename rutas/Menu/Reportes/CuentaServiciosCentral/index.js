const rutas_reportes = require("express").Router();

//const reportes = require("../../../../controllers/reportes");
const caja = require("../../../../controllers/caja");
const cuenta_corriente = require("../../../../controllers/cuenta_corriente");
const oficinas = require("../../../../controllers/oficina");
const reporteCuentaServicios = require("../../../../controllers/reporteCuentaServicios");

rutas_reportes.get("/oficina/caja/listar", oficinas.listarOficinasConCajas);
rutas_reportes.get("/listarcuentasservicios", cuenta_corriente.listarcuentasserviciosall);
rutas_reportes.get("/operaciones", reporteCuentaServicios.operaciones);
rutas_reportes.get("/oficina/buscar/:oficina_codigo/caja", caja.listarPor);

module.exports = rutas_reportes;
