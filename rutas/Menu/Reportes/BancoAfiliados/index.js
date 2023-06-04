const rutas_reportes = require("express").Router();
const reporteBanco_Afiliados = require("../../../../controllers/reporteBanco_afiliados");

rutas_reportes.get("/giros/:id_banco/:estado/:fechai/:fechaf", reporteBanco_Afiliados.bancos);

module.exports = rutas_reportes;