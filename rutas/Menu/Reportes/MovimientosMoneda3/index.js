const rutas_reportes = require("express").Router();

const movimientos = require("../../../../controllers/reporte_movimiento_moneda3");
const oficinas = require("../../../../controllers/oficina");
const cajas = require("../../../../controllers/caja");

rutas_reportes.get("/listar_cajas", cajas.listar);
rutas_reportes.get("/listar_oficinas", oficinas.listar);

rutas_reportes.get("/saldo_caja/:caja_codigo/:fecha_inicio/:fecha_final",movimientos.saldos_caja)
rutas_reportes.get("/saldo_oficina/:oficina_codigo/:fecha_inicio/:fecha_final",movimientos.saldos_oficina)

rutas_reportes.get("/caja/:caja_codigo/:razon_social/:fecha_inicio/:fecha_final",movimientos.movimientos_caja)
rutas_reportes.get("/oficina/:oficina_codigo/:razon_social/:fecha_inicio/:fecha_final",movimientos.movimientos_oficina);

module.exports = rutas_reportes;