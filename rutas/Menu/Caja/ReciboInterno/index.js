const rutas_trasferencias = require("express").Router();
const recibo_interno = require("../../../../controllers/recibo_interno");
const cuenta = require("../../../../controllers/cuenta");
const centrocosto = require("../../../../controllers/centro_costo");
const documentoserie = require("../../../../controllers/documento_serie");

const verificarPerfil = require("../../../../middleware/verificarPerfil");
const verificarOficina = require("../../../../middleware/verificarOficina");

rutas_trasferencias.use(verificarPerfil(3));
rutas_trasferencias.post("/", [verificarOficina.verificarOfOrigen()], recibo_interno.crear);
rutas_trasferencias.get("/listar/cuentas/activas", cuenta.listarActivas);
rutas_trasferencias.get("/listar/centrocosto/activas", centrocosto.listarActivas);
rutas_trasferencias.get("/documentoserie", documentoserie.listarActivos);

module.exports = rutas_trasferencias;
