const rutas_trasferencias = require("express").Router();
const caja_trabajo = require("../../../../controllers/caja_trabajo");
const caja = require("../../../../controllers/caja");
const habilitacion = require("../../../../controllers/habilitacion");
const cuenta_usuario = require("../../../../controllers/cuenta_usuario");
const documentoserie = require("../../../../controllers/documento_serie");
const monedaDenominacion = require("../../../../controllers/moneda_denominacion");
const verificarOficina = require("../../../../middleware/verificarOficina");
//NIVEL >=3
const verificarPerfil = require("../../../../middleware/verificarPerfil");

rutas_trasferencias.use(verificarPerfil(3));
rutas_trasferencias.post("/", caja_trabajo.cerrarCaja); //guardaTransferencias
rutas_trasferencias.get("/tipoarqueo", cuenta_usuario.tipoArqueo); //guardaTransferencias
rutas_trasferencias.get("/getsaldocaja", caja_trabajo.obtenerSaldos); //guardaTransferencias
rutas_trasferencias.get("/monedaDenominacion/listar", monedaDenominacion.listar); //guardaTransferencias
rutas_trasferencias.post("/verificarsaldos", caja_trabajo.verificarSaldos); //guardaTransferencias
rutas_trasferencias.get("/documentoserie", documentoserie.listarRecibosHabilitaciones); //guardaTransferencias
rutas_trasferencias.get("/oficina/buscar/:oficina_codigo/caja", caja.listarPor); //guardaTransferencias
rutas_trasferencias.post("/habilitacion", [verificarOficina.verificarOfOrigen()], habilitacion.crear); //guardaTransferencias

module.exports = rutas_trasferencias;
