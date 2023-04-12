const rutas_reportes = require("express").Router();

const reportes = require("../../../../controllers/resumen_dolar");

rutas_reportes.get("/listaoficinas",reportes.listarPor);

rutas_reportes.get("/:oficina_codigo",reportes.resumen_dolar);

module.exports = rutas_reportes;