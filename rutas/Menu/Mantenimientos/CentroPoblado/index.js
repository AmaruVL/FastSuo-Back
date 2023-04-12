const rutas_clientes = require("express").Router();
const oficina = require("../../../../controllers/oficina");
const centroPoblado = require("../../../../controllers/centro_poblado");

const verificarPerfil = require("../../../../middleware/verificarPerfil");

rutas_clientes.get("/listar", [verificarPerfil(1)], centroPoblado.listar);
rutas_clientes.post("/", [verificarPerfil(3)], centroPoblado.crear);
rutas_clientes.put("/actualizar/:id_centro_poblado", [verificarPerfil(4)], centroPoblado.actualizar);
rutas_clientes.delete("/eliminar/:id_centro_poblado", [verificarPerfil(6)], centroPoblado.eliminar);

module.exports = rutas_clientes;
