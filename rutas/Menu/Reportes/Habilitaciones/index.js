const rutas_reportes = require("express").Router();

const rep_habilitaciones = require("../../../../controllers/reporteHabilitaciones");
const oficinas = require("../../../../controllers/oficina");
const cajas = require("../../../../controllers/caja");

rutas_reportes.get("/listar_cajas", cajas.listar);
rutas_reportes.get("/listar_oficinas", oficinas.listar);

rutas_reportes.post("/detalle",rep_habilitaciones.habilitaciones);

module.exports = rutas_reportes;