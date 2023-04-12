const rutas_trasferencias = require("express").Router();
const operacion_caja = require("../../../../controllers/operacion_caja");
const transferencia = require("../../../../controllers/transferencia");
const OperacionCuenta = require("../../../../controllers/operacion_cuenta");
const recibo_interno = require("../../../../controllers/recibo_interno");
const habilitacion = require("../../../../controllers/habilitacion");
const validar = require("../../../../middleware/validar");
const documentoserie = require("../../../../controllers/documento_serie");
const verificarPerfil = require("../../../../middleware/verificarPerfil");
const verificarOficina = require("../../../../middleware/verificarOficina");

//NIVEL >= 1
rutas_trasferencias.use(verificarPerfil(1));
rutas_trasferencias.get("/listar/:nombre_cliente/:cantidad/:pagina", operacion_caja.listarOperacionesDia);
rutas_trasferencias.get("/listar/:cantidad/:pagina", operacion_caja.listarUltimasOperaciones);
rutas_trasferencias.get("/ordenpago/buscar/:op_documento_codigo/:op_documento_serie/:op_nro_operacion", transferencia.buscarOrdenPago);
rutas_trasferencias.get("/transferencia/buscar/:St_documento_codigo/:St_documento_serie/:nro_Solicitud", transferencia.buscarTransferencia);
rutas_trasferencias.get("/operacioncuenta/buscar/:documento_codigo/:documento_serie/:nro_operacion", OperacionCuenta.buscarOperacion);
rutas_trasferencias.get("/recibointerno/buscar/:documento_codigo/:documento_serie/:nro_operacion", recibo_interno.buscar);
rutas_trasferencias.get("/habilitacion/buscar/:documento_codigo/:documento_serie/:nro_operacion", habilitacion.buscar);

rutas_trasferencias.use(verificarPerfil(2));
rutas_trasferencias.get("/documentoserie/egreso", documentoserie.listarRecibosEgreso);
rutas_trasferencias.get("/documentoserie/ingreso", documentoserie.listarRecibosIngreso);
rutas_trasferencias.get("/listarautorizadas", transferencia.listarAutorizados);

rutas_trasferencias.use(verificarPerfil(4));
rutas_trasferencias.put("/realizaranulacion", [verificarOficina.verificarOfOrigen()], transferencia.realizarAnulacion);
rutas_trasferencias.put("/realizardevolucion", [verificarOficina.verificarOfOrigen()], transferencia.realizarDevolucion);
rutas_trasferencias.put("/realizarreembolso", [verificarOficina.verificarOfOrigen()], transferencia.realizarReembolso);
rutas_trasferencias.put("/realizarcambiodestino", [verificarOficina.verificarOfOrigen()], transferencia.realizarCambioDestino);
rutas_trasferencias.put("/realizarcambiobeneficiario", [verificarOficina.verificarOfOrigen()], transferencia.realizarCambioBeneficiario);
//rutas_trasferencias.put("/realizarextorno", [verificarOficina.verificarOfOrigen()], transferencia.realizarExtorno);
rutas_trasferencias.put("/extornarrecibointerno", [verificarOficina.verificarOfOrigen()], recibo_interno.extornar);

module.exports = rutas_trasferencias;
