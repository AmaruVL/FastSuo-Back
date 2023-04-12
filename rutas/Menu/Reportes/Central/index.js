const rutas_reportes = require("express").Router();

const reportes = require("../../../../controllers/reportes");
const caja_trabajo = require("../../../../controllers/caja_trabajo");
const empresas = require("../../../../controllers/empresa");
const oficinas = require("../../../../controllers/oficina");
const cajas = require("../../../../controllers/caja");

rutas_reportes.get("/listar_cajas", cajas.listar);
rutas_reportes.get("/listar_oficinas", oficinas.listar);
rutas_reportes.get("/listar_empresas", empresas.listar);

rutas_reportes.post("/saldos",reportes.saldos_caja)
rutas_reportes.post("/saldosoficina",reportes.saldos_oficina)
rutas_reportes.post("/saldosempresa",reportes.saldos_empresa)

rutas_reportes.post("/detalle",reportes.detalle_caja)
rutas_reportes.post("/detalleoficina",reportes.detalle_oficina);
rutas_reportes.post("/detalleempresa",reportes.detalle_empresa);
rutas_reportes.post("/resumen",reportes.resumenDetalle);

//---PDF
rutas_reportes.post("/pdfdetcaj", reportes.listaDetalleCaja)
rutas_reportes.post("/pdfdetof",reportes.listaDetalleOficina)
rutas_reportes.post("/pdfdetemp",reportes.listaDetalleEmpresa)

//--EXCEL
rutas_reportes.post("/excelcaja", reportes.excel_caja)
rutas_reportes.post("/excelof", reportes.excel_of)
rutas_reportes.post("/excelemp", reportes.excel_emp)

module.exports = rutas_reportes;