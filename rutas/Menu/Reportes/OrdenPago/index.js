const rutas_reportes = require("express").Router();
const empresas = require("../../../../controllers/empresa");
const oficinas = require("../../../../controllers/oficina");

const reportesOrdenPago = require("../../../../controllers/reportesOrdenPago");

rutas_reportes.get("/pdfoficina/:oficina/:opcion/:estado/:nombre_beneficiario/:nombre_solicitante/:fechai/:fechaf", reportesOrdenPago.listarecibidosOf);
rutas_reportes.get("/pdfempresa/:empresa/:opcion/:estado/:nombre_beneficiario/:nombre_solicitante/:fechai/:fechaf", reportesOrdenPago.listarecibidosEmp);
rutas_reportes.post("/pdfrecibidos", reportesOrdenPago.listarecibidos);

rutas_reportes.get("/recibidosOficina/:oficina/:opcion/:estado/:nombre_beneficiario/:nombre_solicitante/:fechai/:fechaf",reportesOrdenPago.recibidos_oficina);
rutas_reportes.get("/recibidosEmpresa/:empresa/:opcion/:estado/:nombre_beneficiario/:nombre_solicitante/:fechai/:fechaf",reportesOrdenPago.recibidos_empresa);
rutas_reportes.post("/recibidos",reportesOrdenPago.recibidos);

rutas_reportes.get("/listar_empresas", empresas.listar);
rutas_reportes.get("/listar_oficinas", oficinas.listar);

//--------excel
rutas_reportes.post("/excelrecibidoscaja", reportesOrdenPago.excelcaja);
rutas_reportes.get("/excelrecibidosof/:oficina/:opcion/:estado/:nombre_beneficiario/:nombre_solicitante/:fechai/:fechaf", reportesOrdenPago.exceloficina);
rutas_reportes.get("/excelrecibidosemp/:empresa/:opcion/:estado/:nombre_beneficiario/:nombre_solicitante/:fechai/:fechaf", reportesOrdenPago.excelempresa);

module.exports = rutas_reportes;