const rutas_transferencias = require("express").Router();
const documentoSerie = require("../../../../controllers/documento_serie");
const habilitacion = require("../../../../controllers/habilitacion");
const operacionCaja = require("../../../../controllers/operacion_caja");
const reciboInterno = require("../../../../controllers/recibo_interno");
const transferencia = require("../../../../controllers/transferencia");

const verificarPerfil = require("../../../../middleware/verificarPerfil");
const verificarOficina = require("../../../../middleware/verificarOficina");

rutas_transferencias.use(verificarPerfil(4));
/*
rutas_transferencias.get("/documentosserie", documentoSerie.listarTodosActivos); //guardarTIpo de  cambio
rutas_transferencias.get("/habilitacion/buscar/:documento_codigo/:documento_serie/:nro_operacion", habilitacion.buscar); //guardarTIpo de  cambio
rutas_transferencias.post("/habilitacion/anular", [verificarOficina.verificarOfOrigen()], habilitacion.anular); //guardarTIpo de  cambio
rutas_transferencias.get("/tipocambio/buscar/:documento_codigo/:documento_serie/:nro_operacion", operacionCaja.buscarOperacioncaja); //guardarTIpo de  cambio
rutas_transferencias.get("/recibointerno/buscar/:documento_codigo/:documento_serie/:nro_operacion", reciboInterno.buscar); //guardarTIpo de  cambio
rutas_transferencias.get("/transferencia/buscar/:St_documento_codigo/:St_documento_serie/:nro_Solicitud", transferencia.buscarTransferencia); //guardarTIpo de  cambio
rutas_transferencias.post("/transferencia/anular",  [verificarOficina.verificarOfOrigen()],transferencia.anular); //guardarTIpo de  cambio
rutas_transferencias.get("/ordenpago/buscar/:op_documento_codigo/:op_documento_serie/:op_nro_operacion", transferencia.buscarOrdenPago); //guardarTIpo de  cambio
rutas_transferencias.get("/extornar/documentoserie", documentoSerie.listarDocumentoRI); //guardarTIpo de  cambio
rutas_transferencias.post("/extornar", [verificarOficina.verificarOfOrigen()], transferencia.extornar); //guardarTIpo de  cambio
*/

module.exports = rutas_transferencias;
