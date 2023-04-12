const rutas_reportes = require("express").Router();

const reportes = require("../../../../controllers/reporte_cuentas");

rutas_reportes.get("/oficina", reportes.resumen_saldos);
rutas_reportes.get("/oficina/:fecha_fin", reportes.resumen_saldos);
rutas_reportes.get("/empresas", reportes.resumen_saldos_empresas);
rutas_reportes.get("/empresas/:fecha_fin", reportes.resumen_saldos_empresas);
rutas_reportes.get("/saldoafiliadospdf/:fecha_fin",reportes.listarsaldosafiliados)
rutas_reportes.get("/saldoafiliadosempresaspdf/:fecha_fin",reportes.listarsaldosafiliadosempresas)

module.exports = rutas_reportes;