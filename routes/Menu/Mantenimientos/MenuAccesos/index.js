const rutas_accesos = require("express").Router();
const accesos = require("../../../../controllers/menu_acceso");
const verificarPerfil = require("../../../../middleware/verificarPerfil");

rutas_accesos.get("/listar", [verificarPerfil(1)], accesos.listar);
rutas_accesos.get("/buscar/:menu_codigo", [verificarPerfil(2)], accesos.buscar);
rutas_accesos.post("/", [verificarPerfil(3)], accesos.crear);
rutas_accesos.put("/actualizar/:menu_codigo", [verificarPerfil(4)], accesos.actualizar);
rutas_accesos.delete("/eliminar/:menu_codigo", [verificarPerfil(6)], accesos.eliminar);

module.exports = rutas_accesos;
