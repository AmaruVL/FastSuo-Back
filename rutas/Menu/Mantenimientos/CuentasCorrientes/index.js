const rutas_cuentas = require("express").Router();
const oficina = require("../../../../controllers/oficina");
const cliente_proveedor = require("../../../../controllers/cliente_proveedor");
const verificarPerfil = require("../../../../middleware/verificarPerfil");

rutas_cuentas.get("/buscardni/:id_cliente", [verificarPerfil(3)], cliente_proveedor.buscar);
rutas_cuentas.get("/oficina/listar/activas", [verificarPerfil(3)], oficina.listarOficinasActivas);

module.exports = rutas_cuentas;
