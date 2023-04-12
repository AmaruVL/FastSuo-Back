const rutas_reportes = require("express").Router();

const reportes_resumen = require("../../../../controllers/resumen_reportes");
const reportes = require("../../../../controllers/reportes")

const cajas = require("../../../../controllers/caja");

rutas_reportes.post("/saldoanterior",reportes_resumen.saldo_anterior_giros)
//rutas_reportes.post("/saldorecibidas",reportes_resumen.saldo_recibidas)
rutas_reportes.post("/saldoporpagar",reportes_resumen.saldo_por_pagar)
//rutas_reportes.post("/saldorecaudadas",reportes_resumen.saldo_recaudadas)

rutas_reportes.post("/resumen",reportes_resumen.resumen)
rutas_reportes.post("/saldos",reportes.saldos_caja)


module.exports = rutas_reportes;