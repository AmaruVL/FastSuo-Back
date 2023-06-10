const rutas_reportes = require("express").Router();

const cuentas = require("../../../../controllers/cuenta")
const oficina = require("../../../../controllers/oficina")
const centrocosto = require("../../../../controllers/centro_costo")

rutas_reportes.get("/listarcuentas",cuentas.listar);
rutas_reportes.get("/listarcentrocostos",centrocosto.listar);
rutas_reportes.get("/listar_oficinas", oficina.listar);

module.exports = rutas_reportes;