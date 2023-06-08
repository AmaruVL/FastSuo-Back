const rutas_accesos = require("express").Router();
const accesos = require("../../../../controllers/menu_acceso");
const verificarPerfil = require("../../../../middleware/verificarPerfil");

//TODO: Agregar "verificarPerfil" a cada endpoint
// rutas_accesos.get("/listar", [verificarPerfil(1)], accesos.listar);
// rutas_accesos.get("/buscar/:menu_codigo", [verificarPerfil(2)], accesos.buscar);
// rutas_accesos.post("/", [verificarPerfil(3)], accesos.crear);
// rutas_accesos.put("/actualizar/:menu_codigo", [verificarPerfil(4)], accesos.actualizar);
// rutas_accesos.delete("/eliminar/:menu_codigo", [verificarPerfil(6)], accesos.eliminar);
rutas_accesos.get("/listar", accesos.listar);
rutas_accesos.get("/buscar/:menu_codigo", accesos.buscar);
rutas_accesos.post("/", accesos.crear);
rutas_accesos.put("/actualizar/:menu_codigo", accesos.actualizar);
rutas_accesos.delete("/eliminar/:menu_codigo", accesos.eliminar);
module.exports = rutas_accesos;
