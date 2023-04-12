const rutas_reportes = require("express").Router();

const reportes = require("../../../../controllers/detalle_caja_por_oficina");

rutas_reportes.post("/saldos_oficina",reportes.saldos_oficina);

rutas_reportes.post("/detalleoficina",reportes.detalle_caja_porOficina);

rutas_reportes.get("/lista_cajas",reportes.listarPor);

//---PDF
rutas_reportes.post("/pdfdetalle",reportes.listaDetalleOficina)

module.exports = rutas_reportes;