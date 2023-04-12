const rutas_configuracion = require("express").Router();
const configuracion = require("../../../../controllers/configuracion");
const verificarPerfil = require("../../../../middleware/verificarPerfil");

rutas_configuracion.get("/listar", [verificarPerfil(1)], configuracion.listar);
rutas_configuracion.get("/buscar/:clave", [verificarPerfil(2)], configuracion.buscar);
rutas_configuracion.post("/", [verificarPerfil(3)], configuracion.crear);
rutas_configuracion.put("/actualizar/:clave", [verificarPerfil(4)], configuracion.actualizar);
rutas_configuracion.delete("/eliminar/:clave", [verificarPerfil(6)], configuracion.eliminar);

module.exports = rutas_configuracion;