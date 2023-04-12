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
rutas_transferencias.get("/transferencia/buscarid/:nro_operacion/:oficina_codigo", transferencia.buscarIdOficina);
rutas_transferencias.post("/transferencia/anular", transferencia.anularCentral);

rutas_transferencias.get("/habilitacion/buscar/:nro_operacion/:oficina_codigo", habilitacion.buscarPorID); //guardarTIpo de  cambio
rutas_transferencias.post("/habilitacion/anular", habilitacion.anularCentral); //guardarTIpo de  cambio

rutas_transferencias.get("/ordenpago/buscar/:op_nro_operacion/:oficina_codigo", transferencia.buscarPorIdOrdenPago); //guardarTIpo de  cambio
rutas_transferencias.post("/extornar", transferencia.extornarCentral); //guardarTIpo de  cambio
*/
module.exports = rutas_transferencias;
