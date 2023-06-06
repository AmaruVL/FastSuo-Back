const rutas_trasferencias = require("express").Router();

const oficina = require("../../../../controllers/oficina");
const documentoserie = require("../../../../controllers/documento_serie");
const verificarPerfil = require("../../../../middleware/verificarPerfil");
const verificarOficina = require("../../../../middleware/verificarOficina");

//NIVEL >=3
rutas_trasferencias.use(verificarPerfil(3));
rutas_trasferencias.get("/oficina/listar/activas", oficina.listarOficinasActivas); //listarOficinas
rutas_trasferencias.get("/documentoserie", documentoserie.listarActivos); //listar Entidad Bancaria

module.exports = rutas_trasferencias;
