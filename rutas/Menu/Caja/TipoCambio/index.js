const rutas_trasferencias = require("express").Router();
const operacionCaja = require("../../../../controllers/operacion_caja");
const documentoSerie = require("../../../../controllers/documento_serie");

const verificarPerfil = require("../../../../middleware/verificarPerfil");
const verificarOficina = require("../../../../middleware/verificarOficina");

rutas_trasferencias.use(verificarPerfil(3));
rutas_trasferencias.post("/",[verificarOficina.verificarOfOrigen()], operacionCaja.crearTipoCambio); //guardarTIpo de  cambio
rutas_trasferencias.get("/documentoserie", documentoSerie.listarActivos); //guardarTIpo de  cambio

module.exports = rutas_trasferencias;