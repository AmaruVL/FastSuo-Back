const rutas_menus = require("express").Router();
const menus = require("../../../../controllers/menu_acceso");
const verificarPerfil = require("../../../../middleware/verificarPerfil");

rutas_menus.get("/listar", [verificarPerfil(1)], menus.listar);
rutas_menus.get("/buscar/:menuId", [verificarPerfil(2)], menus.buscar);
rutas_menus.get("/", [verificarPerfil(3)], menus.crear);
rutas_menus.put("/actualizar/:menuId", [verificarPerfil(4)], menus.actualizar);
rutas_menus.delete("/eliminar/:menuId", [verificarPerfil(6)], menus.eliminar);

module.exports = rutas_menus;
