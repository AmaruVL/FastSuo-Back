// const rutas_trasferencias = require("express").Router();
// const operacion_caja = require("../../../../controllers/operacion_caja");
// const recibo_interno = require("../../../../controllers/recibo_interno");
// const habilitacion = require("../../../../controllers/habilitacion");
// const validar = require("../../../../middleware/validar");
// const documentoserie = require("../../../../controllers/documento_serie");
// const verificarPerfil = require("../../../../middleware/verificarPerfil");
// const verificarOficina = require("../../../../middleware/verificarOficina");

// //NIVEL >= 1
// rutas_trasferencias.use(verificarPerfil(1));
// rutas_trasferencias.get("/listar/:nombre_cliente/:cantidad/:pagina", operacion_caja.listarOperacionesDia);
// rutas_trasferencias.get("/listar/:cantidad/:pagina", operacion_caja.listarUltimasOperaciones);
// rutas_trasferencias.get("/recibointerno/buscar/:documento_codigo/:documento_serie/:nro_operacion", recibo_interno.buscar);
// rutas_trasferencias.get("/habilitacion/buscar/:documento_codigo/:documento_serie/:nro_operacion", habilitacion.buscar);

// rutas_trasferencias.use(verificarPerfil(2));
// rutas_trasferencias.get("/documentoserie/egreso", documentoserie.listarRecibosEgreso);
// rutas_trasferencias.get("/documentoserie/ingreso", documentoserie.listarRecibosIngreso);

// rutas_trasferencias.use(verificarPerfil(4));
// rutas_trasferencias.put("/extornarrecibointerno", [verificarOficina.verificarOfOrigen()], recibo_interno.extornar);

// module.exports = rutas_trasferencias;
