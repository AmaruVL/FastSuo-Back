const rutas_reportes = require("express").Router();

const girosgeneral = require("../../../../controllers/reporteGiros_general");
const oficinas = require("../../../../controllers/oficina");

rutas_reportes.get("/listar_oficinas", oficinas.listar);

rutas_reportes.get("/buscar/:oficina_origen/:oficina_destino/:query/:estado/:importei/:importef/:fechaInicio/:fechaFin", girosgeneral.giros);

module.exports = rutas_reportes;