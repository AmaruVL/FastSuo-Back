const rutas_clientes = require("express").Router();
const cuenta_usuario = require("../../../../controllers/cuenta_usuario");
const verificarPerfil = require("../../../../middleware/verificarPerfil");

rutas_clientes.put("/", [verificarPerfil(4)], cuenta_usuario.cambiarContrasena);

module.exports = rutas_clientes;
