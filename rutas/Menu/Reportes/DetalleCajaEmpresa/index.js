const rutas_reportes = require("express").Router();

const reportes = require("../../../../controllers/detalle_caja_por_empresa");

rutas_reportes.post("/saldosoficina",reportes.saldos_empresa);

rutas_reportes.post("/detalleempresa",reportes.detalle_caja_porEmpresa);

rutas_reportes.get("/lista_oficinas",reportes.listarPor);

//---PDF
rutas_reportes.post("/pdfdetalle",reportes.pdfDetalle)

module.exports = rutas_reportes;