const rutas_reportes = require("express").Router();

const reportes = require("../../../../controllers/rep_giros_recaudados");
const caja_trabajo = require("../../../../controllers/caja_trabajo");
const empresas = require("../../../../controllers/empresa");
const oficinas = require("../../../../controllers/oficina");
const cajas = require("../../../../controllers/caja");

rutas_reportes.get("/listar_cajas", cajas.listar);
rutas_reportes.get("/listar_oficinas", oficinas.listar);
rutas_reportes.get("/listar_empresas", empresas.listar);

rutas_reportes.post("/detalle",reportes.detalle_caja)
rutas_reportes.post("/detalleoficina",reportes.detalle_oficina);
rutas_reportes.post("/detalleempresa",reportes.detalle_empresa)

//---PDF
rutas_reportes.post("/pdfreccaj",reportes.listarecaudadosCaja)
rutas_reportes.get("/pdfrecof/:oficina/:nombre_beneficiario/:nombre_solicitante/:opcion_fecha/:estado/:fechai/:fechaf",reportes.listarecaudadosOf)
rutas_reportes.get("/pdfrecemp/:empresa/:nombre_beneficiario/:nombre_solicitante/:opcion_fecha/:estado/:fechai/:fechaf",reportes.listarecaudadosEmp)

//---EXCEL
rutas_reportes.post("/excelcaj",reportes.excelcaja);
rutas_reportes.get("/excelof/:oficina/:nombre_beneficiario/:nombre_solicitante/:opcion_fecha/:estado/:fechai/:fechaf",reportes.exceloficina)
rutas_reportes.get("/excelemp/:empresa/:nombre_beneficiario/:nombre_solicitante/:opcion_fecha/:estado/:fechai/:fechaf",reportes.excelempresa)

module.exports = rutas_reportes;