const rutas_reportes = require("express").Router();

// const reportes = require("../../../../controllers/reportes");
const caja_trabajo = require("../../../../controllers/caja_trabajo");
const empresas = require("../../../../controllers/empresa");
const oficinas = require("../../../../controllers/oficina");
const cajas = require("../../../../controllers/caja");
const verificarPerfil = require("../../../../middleware/verificarPerfil");

const resumenMensual = require("../../../../controllers/resumen_mensual");

rutas_reportes.get("/listar_oficinas", oficinas.listar);
rutas_reportes.get("/excel/:oficina/:fechai/:fechaf", resumenMensual.excel);


module.exports = rutas_reportes;