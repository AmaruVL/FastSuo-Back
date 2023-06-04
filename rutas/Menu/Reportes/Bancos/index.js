const rutas_reportes = require("express").Router();
const reporteBanco = require("../../../../controllers/reporteBancos");
const oficinas = require("../../../../controllers/oficina");
const usuarios = require("../../../../controllers/cuenta_usuario");

rutas_reportes.get("/listar_oficinas", oficinas.listar);
rutas_reportes.get("/listar_usuarios", usuarios.listar);
rutas_reportes.get("/bancos/:id_banco/:oficina_origen/:in_usuario/:opcion/:estado/:tipo/:fechai/:fechaf", reporteBanco.bancos);

//---PDF
rutas_reportes.get("/pdfbancos/:id_banco/:oficina_origen/:in_usuario/:opcion/:estado/:tipo/:fechai/:fechaf", reporteBanco.listargirosBanco)

module.exports = rutas_reportes;