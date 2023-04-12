const rutas_clientes = require("express").Router();
const cuenta_usuario = require("../../../../controllers/cuenta_usuario");
const caja = require("../../../../controllers/caja");
const verificarPerfil = require("../../../../middleware/verificarPerfil");

rutas_clientes.put("/", [verificarPerfil(4)], cuenta_usuario.cambiarContrasena);
rutas_clientes.put("/caja/cambiarcontrasena", [verificarPerfil(4)], caja.cambiarContrasena);

module.exports = rutas_clientes;
