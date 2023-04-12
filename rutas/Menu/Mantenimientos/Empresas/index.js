const sub_rutas = require("express").Router();
const empresa = require("../../../../controllers/empresa");
const oficina = require("../../../../controllers/oficina");
const centrospoblados = require("../../../../controllers/centro_poblado");
const caja = require("../../../../controllers/caja");
const contrato = require("../../../../controllers/contrato");
const comision = require("../../../../controllers/comision");
const verificarPerfil = require("../../../../middleware/verificarPerfil");

//EMPRESAS
sub_rutas.get("/listar", [verificarPerfil(1)], empresa.listar);
sub_rutas.get("/buscarempresas/:empresa_nombre", [verificarPerfil(1)], empresa.buscarNombre);
sub_rutas.get("/buscar/:empresa_codigo", [verificarPerfil(2)], empresa.buscar);
sub_rutas.post("/", [verificarPerfil(3)], empresa.crear);
sub_rutas.put("/actualizar/:empresa_codigo", [verificarPerfil(4)], empresa.actualizar);
sub_rutas.put("/desactivar/:empresa_codigo", [verificarPerfil(5)], empresa.desactivar);
sub_rutas.delete("/eliminar/:empresa_codigo", [verificarPerfil(6)], empresa.eliminar);

//OFICINAS
sub_rutas.get("/oficina/listar", [verificarPerfil(1)], oficina.listar);
sub_rutas.get("/buscaroficinas/:oficina_nombre", [verificarPerfil(1)], oficina.buscarNombre);
sub_rutas.get("/oficina/buscar/:oficina_codigo", [verificarPerfil(2)], oficina.buscar);
sub_rutas.get("/oficina/buscar/:oficina_codigo/caja", [verificarPerfil(1)], caja.listarPor);
sub_rutas.post("/oficina/", [verificarPerfil(3)], oficina.crear);
sub_rutas.get("/oficina/listar/activas", [verificarPerfil(3)], oficina.listarOficinasActivas);
sub_rutas.put("/oficina/actualizar/:oficina_codigo", [verificarPerfil(4)], oficina.actualizar);
sub_rutas.put("/oficina/desactivar/:oficina_codigo", [verificarPerfil(5)], oficina.desactivar);
sub_rutas.delete("/oficina/eliminar/:oficina_codigo", [verificarPerfil(6)], oficina.eliminar);

//CENTROS POBLADOS
sub_rutas.get("/centrospoblados/listar", [verificarPerfil(1)], centrospoblados.listar);

//CONTRATO
sub_rutas.get("/contrato/buscar/:oficina_codigo", [verificarPerfil(2)], contrato.buscar);
sub_rutas.post("/contrato/", [verificarPerfil(3)], contrato.crear);
sub_rutas.put("/contrato/actualizar/:nro_contrato/:oficina_codigo", [verificarPerfil(4)], contrato.actualizar);
sub_rutas.put("/contrato/desactivar/:nro_contrato/:oficina_codigo", [verificarPerfil(5)], contrato.desactivar);

//COMISION
sub_rutas.get("/comision/listar", [verificarPerfil(1)], comision.listar);
sub_rutas.get("/comision/buscar/:oficina_codigo", [verificarPerfil(2)], comision.buscar);
sub_rutas.post("/comision/", [verificarPerfil(3)], comision.crear);
sub_rutas.post("/comision/nuevorango", [verificarPerfil(3)], comision.nuevoRango);
sub_rutas.post("/comision/asignarOficinas", [verificarPerfil(3)], comision.asignarOficinas);
sub_rutas.get("/comision/listarminmax", [verificarPerfil(3)], comision.listarMinMax);
sub_rutas.put("/comision/actualizarrango", [verificarPerfil(4)], comision.actualizarRango);
sub_rutas.delete("/comision/eliminarrango", [verificarPerfil(5)], comision.eliminarRango);

//CAJAS
sub_rutas.get("/caja/listar", [verificarPerfil(1)], caja.listar);
sub_rutas.get("/caja/buscar/:caja_codigo", [verificarPerfil(2)], caja.buscar);
sub_rutas.post("/caja/", [verificarPerfil(3)], caja.crear);
sub_rutas.put("/caja/actualizar/:caja_codigo", [verificarPerfil(4)], caja.actualizar);
sub_rutas.put("/caja/desactivar/:caja_codigo", [verificarPerfil(5)], caja.desactivar);
sub_rutas.delete("/caja/eliminar/:caja_codigo", [verificarPerfil(6)], caja.eliminar);

module.exports = sub_rutas;
