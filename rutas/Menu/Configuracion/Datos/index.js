const rutas_clientes = require("express").Router();
const clientes = require("../../../../controllers/cliente_proveedor");
const oficinas = require("../../../../controllers/oficina");
const comision = require("../../../../controllers/comision");
const verificarPerfil = require("../../../../middleware/verificarPerfil");

rutas_clientes.get("/listar", [verificarPerfil(1)], clientes.listarMin);
rutas_clientes.get("/oficina/listar/activas", [verificarPerfil(1)], oficinas.listarOficinasActivas);
rutas_clientes.get("/comision/listar", [verificarPerfil(1)], comision.listar);

module.exports = rutas_clientes;