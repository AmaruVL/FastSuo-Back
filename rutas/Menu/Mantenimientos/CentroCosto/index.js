const rutas_clientes = require("express").Router();
const oficina = require("../../../../controllers/oficina");
const centroCosto = require("../../../../controllers/centro_costo");

const verificarPerfil = require("../../../../middleware/verificarPerfil");

rutas_clientes.get("/listar", [verificarPerfil(1)], centroCosto.listar);
rutas_clientes.get("/oficina/listar/activas", [verificarPerfil(3)], oficina.listarOficinasActivas);
rutas_clientes.post("/", [verificarPerfil(3)], centroCosto.crear);
rutas_clientes.put("/actualizar/:centro_costo_id", [verificarPerfil(4)], centroCosto.actualizar);
rutas_clientes.put("/desactivar/:centro_costo_id", [verificarPerfil(5)], centroCosto.desactivar);
rutas_clientes.delete("/eliminar/:centro_costo_id", [verificarPerfil(6)], centroCosto.eliminar);

module.exports = rutas_clientes;
