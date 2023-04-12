const sub_rutas = require("express").Router();
const oficina = require("../../../../controllers/oficina");
const documento = require("../../../../controllers/documento");
const documento_serie = require("../../../../controllers/documento_serie");
const verificarPerfil = require("../../../../middleware/verificarPerfil");

sub_rutas.get("/listar", [verificarPerfil(1)], documento.listar);
sub_rutas.get("/buscar/:documento_codigo", [verificarPerfil(2)], documento.buscar);
sub_rutas.post("/", [verificarPerfil(3)], documento.crear);
sub_rutas.put("/actualizar/:documento_codigo", [verificarPerfil(4)], documento.actualizar);
sub_rutas.put("/desactivar/:documento_codigo", [verificarPerfil(5)], documento.desactivar);
sub_rutas.delete("/eliminar/:documento_codigo", [verificarPerfil(6)], documento.eliminar);

sub_rutas.get("/series/listar", [verificarPerfil(1)], documento_serie.listar);
sub_rutas.get("/series/documentos/oficinas", [verificarPerfil(1)], documento_serie.listarDocumentosOficinas);
sub_rutas.get("/series/buscar/:documento_codigo/:documento_serie", [verificarPerfil(2)], documento_serie.buscar);
sub_rutas.post("/series/", [verificarPerfil(3)], documento_serie.crear);
sub_rutas.post("/series/multiple", [verificarPerfil(3)], documento_serie.crearMultiple);
sub_rutas.put("/series/actualizar/:documento_codigo/:documento_serie", [verificarPerfil(4)], documento_serie.actualizar);
sub_rutas.put("/series/desactivar/:documento_codigo/:documento_serie", [verificarPerfil(5)], documento_serie.desactivar);
sub_rutas.delete("/series/eliminar/:documento_codigo/:documento_serie", [verificarPerfil(6)], documento_serie.eliminar);

sub_rutas.get("/oficina/listar/activas", [verificarPerfil(3)], oficina.listarOficinasActivas);

module.exports = sub_rutas;