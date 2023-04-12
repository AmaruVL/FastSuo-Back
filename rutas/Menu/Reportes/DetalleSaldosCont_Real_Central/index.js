const rutas_reportes = require("express").Router();

const reporte_detalle_afi = require("../../../../controllers/reporte_detalleSaldo_cont_real_Central");
const oficinas = require("../../../../controllers/oficina");

rutas_reportes.post("/oficina_saldosCentral",reporte_detalle_afi.saldos)
rutas_reportes.post("/oficina_recaudadosCentral",reporte_detalle_afi.recaudados_oficina);
rutas_reportes.post("/oficina_recibidosCentral",reporte_detalle_afi.recibidos_oficina);
rutas_reportes.post("/oficina_pagadosCentral",reporte_detalle_afi.pagados_oficina);
rutas_reportes.post("/oficinacontable_recibosCentral",reporte_detalle_afi.recibos_oficinaContable);
rutas_reportes.post("/oficinareal_recibosCentral",reporte_detalle_afi.recibos_oficinaReal);

rutas_reportes.get("/listar_oficinas", oficinas.listar);

module.exports = rutas_reportes;