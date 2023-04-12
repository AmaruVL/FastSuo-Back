const rutas_reportes = require("express").Router();
const giros_usuario = require("../../../../controllers/reporteGirosUsuario");
const usuarios = require("../../../../controllers/cuenta_usuario");

rutas_reportes.get("/listar_usuarios", usuarios.listar);
rutas_reportes.get("/buscar/:usuario/:estado/:fechaInicio/:fechaFinal", giros_usuario.girosUsuario);

module.exports = rutas_reportes;