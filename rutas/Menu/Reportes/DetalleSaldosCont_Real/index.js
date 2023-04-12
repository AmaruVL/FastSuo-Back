const rutas_reportes = require("express").Router();

const reporte_detalle_afi = require("../../../../controllers/reporte_detalleSaldo_cont_real");
const oficinas = require("../../../../controllers/oficina");

rutas_reportes.post("/oficina_saldos",reporte_detalle_afi.saldos)
rutas_reportes.post("/oficina_recaudados",reporte_detalle_afi.recaudados_oficina);
rutas_reportes.post("/oficina_recibidos",reporte_detalle_afi.recibidos_oficina);
rutas_reportes.post("/oficina_pagados",reporte_detalle_afi.pagados_oficina);
rutas_reportes.post("/oficinacontable_recibos",reporte_detalle_afi.recibos_oficinaContable);
rutas_reportes.post("/oficinareal_recibos",reporte_detalle_afi.recibos_oficinaReal);

rutas_reportes.get("/listar_oficinas", oficinas.listar);

module.exports = rutas_reportes;