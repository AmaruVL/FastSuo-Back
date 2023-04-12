const rutas_reportes = require("express").Router();

const reportes = require("../../../../controllers/reporte_informe_produccion");
const oficinas = require("../../../../controllers/oficina");
const usuarios = require("../../../../controllers/cuenta_usuario");

rutas_reportes.get("/listar_oficinas", oficinas.listar);
rutas_reportes.get("/listar_usuarios", usuarios.listar);

rutas_reportes.post("/oficina", reportes.detalle_produccion_oficina);
rutas_reportes.post("/usuario", reportes.detalle_produccion_usuario);

module.exports = rutas_reportes;