const rutas_reportes = require("express").Router();

const reportes = require("../../../../controllers/reporte_cuentas");
const cuentas = require("../../../../controllers/cuenta")
const oficina = require("../../../../controllers/oficina")
const centrocosto = require("../../../../controllers/centro_costo")

rutas_reportes.post("/oficina", reportes.cuentas_contables);
rutas_reportes.post("/centrocosto", reportes.cuentas_contables_centro_costo);
rutas_reportes.get("/listarcuentas",cuentas.listar);
rutas_reportes.get("/listarcentrocostos",centrocosto.listar);
rutas_reportes.get("/listar_oficinas", oficina.listar);

//PDF
rutas_reportes.post("/pdfoficina", reportes.cuentas_contables_oficina_pdf);
rutas_reportes.post("/pdfcentrocosto", reportes.cuentas_contables_centrocosto_pdf);

module.exports = rutas_reportes;