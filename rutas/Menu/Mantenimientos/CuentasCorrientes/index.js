const rutas_cuentas = require("express").Router();
const oficina = require("../../../../controllers/oficina");
const entidadesfinancieras = require("../../../../controllers/entidad_financiera_servicios");
const cliente_proveedor = require("../../../../controllers/cliente_proveedor");
const verificarPerfil = require("../../../../middleware/verificarPerfil");

rutas_cuentas.get("/buscardni/:id_cliente", [verificarPerfil(3)], cliente_proveedor.buscar);
rutas_cuentas.get("/oficina/listar/activas", [verificarPerfil(3)], oficina.listarOficinasActivas);
rutas_cuentas.get("/entidadesfinancieras/listar", [verificarPerfil(3)], entidadesfinancieras.listar);

module.exports = rutas_cuentas;
