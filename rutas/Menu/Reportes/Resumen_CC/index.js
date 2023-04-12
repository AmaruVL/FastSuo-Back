const rutas_reportes = require("express").Router();
const reportes = require("../../../../controllers/reporte_cc_Excel");

rutas_reportes.get("/lista_clientes",reportes.listar_clientes);

//---Excel
rutas_reportes.get("/excel/:id_cliente/:fechai/:fechaf",reportes.excel);

module.exports = rutas_reportes;