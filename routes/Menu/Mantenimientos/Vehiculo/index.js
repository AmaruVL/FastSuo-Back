const rutas_accesos = require("express").Router();
const accesos = require("../../../../controllers/vehiculo");
const verificarPerfil = require("../../../../middleware/verificarPerfil");

rutas_accesos.get("/listar", [verificarPerfil(1)], accesos.listar);
rutas_accesos.get("/buscar/:id_vehiculo", [verificarPerfil(2)], accesos.buscar);
rutas_accesos.post("/", [verificarPerfil(3)], accesos.crear);
ruta_accesos.put("/actualizar/:id_vehiculo", [verificarPerfil(4)], accesos.actualizar);
rutas_accesos.delete("/eliminar/:id_vehiculo", [verificarPerfil(6)], accesos.eliminar);

module.exports = rutas_accesos;
