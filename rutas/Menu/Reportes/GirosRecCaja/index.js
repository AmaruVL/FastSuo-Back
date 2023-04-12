const rutas_reportes = require("express").Router();

const reportes = require("../../../../controllers/rep_giros_recaudados");

rutas_reportes.post("/detalle",reportes.detalle_caja);

//---PDF
rutas_reportes.post("/pdfreccaj",reportes.listarecaudadosCaja);

rutas_reportes.post("/excelcaj",reportes.excelcaja);

module.exports = rutas_reportes;