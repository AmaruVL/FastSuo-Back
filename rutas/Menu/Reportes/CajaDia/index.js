const rutas_reportes = require("express").Router();

const reportes = require("../../../../controllers/reportes");
const reporte_monedas = require("../../../../controllers/reporte_monedas");
const caja_trabajo = require("../../../../controllers/caja_trabajo");
const cajas = require("../../../../controllers/caja");

rutas_reportes.get("/saldos_fecha", caja_trabajo.obtenerSaldosFecha);
rutas_reportes.post("/datos_reportes", reportes.obtenerDatos);

rutas_reportes.get("/listar_cajas", cajas.listar);
rutas_reportes.post("/saldos",reportes.saldos_caja)

rutas_reportes.post("/excel", reporte_monedas.excel);

rutas_reportes.post("/detalle",reportes.detalle_caja);

//--PDF
rutas_reportes.post("/pdfdetcaj", reportes.listaDetalleCaja)

module.exports = rutas_reportes;