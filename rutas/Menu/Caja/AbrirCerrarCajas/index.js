const rutas_trasferencias = require("express").Router();
const caja_trabajo = require("../../../../controllers/caja_trabajo");
const caja = require("../../../../controllers/caja");
const oficina = require("../../../../controllers/oficina");
const habilitacion = require("../../../../controllers/habilitacion");
const documentoserie = require("../../../../controllers/documento_serie");
const monedaDenominacion = require("../../../../controllers/moneda_denominacion");
const verificarOficina = require("../../../../middleware/verificarOficina");
//NIVEL >=3
const verificarPerfil = require("../../../../middleware/verificarPerfil");

rutas_trasferencias.use(verificarPerfil(3));
rutas_trasferencias.get("/listaroficinas", oficina.listarOficinasActivasCajas); //guardaTransferencias
rutas_trasferencias.get("/caja/buscar/:caja_codigo", caja_trabajo.obtenerCajaTrabajo); //guardaTransferencias
rutas_trasferencias.post("/abrircaja", caja_trabajo.abrirCajaCentral); //guardaTransferencias
rutas_trasferencias.post("/cerrarcaja", caja_trabajo.cerrarCajaCentral); //guardaTransferencias

module.exports = rutas_trasferencias;
