const rutas_trasferencias = require("express").Router();
const transferencia = require("../../../../controllers/transferencia");
const oficina = require("../../../../controllers/oficina");
const cliente = require("../../../../controllers/cliente_proveedor");
const validar = require("../../../../middleware/validar");
const documentoserie = require("../../../../controllers/documento_serie");
const verificarPerfil = require("../../../../middleware/verificarPerfil");
const verificarOficina = require("../../../../middleware/verificarOficina");
const verificarUsuarioAuthPago = require("../../../../middleware/verificarUsuarioAuthPago");
//NIVEL >= 1
rutas_trasferencias.use(verificarPerfil(1));
rutas_trasferencias.get("/buscar/:query/:fechaInicio/:fechaFin/:codigo_banco/:estado", transferencia.buscarBancos); //guardaTransferencias
//NIVEL >= 3
rutas_trasferencias.use(verificarPerfil(3));
rutas_trasferencias.get("/documentoserie", documentoserie.listarActivos); //guardaTransferencias
rutas_trasferencias.post("/cancelar", [verificarOficina.verificarOfDestino()], transferencia.cancelar); //guardaTransferencias
rutas_trasferencias.put("/autorizarpago", [verificarUsuarioAuthPago.verificar()], transferencia.autorizarPago); //actualiza datos del cliente
rutas_trasferencias.post("/guardarimagen", transferencia.guardarimagen);
//NIVEL >= 4
//rutas_trasferencias.use(verificarPerfil(4));
//rutas_trasferencias.post("/anular", [verificarOficina.verificarOfOrigen()], trasferencia.anular); //guardaTransferencias
//rutas_trasferencias.get("/anular/documentoserie", documentoserie.listarDocumentoRI); //guardaTransferencias

module.exports = rutas_trasferencias;
