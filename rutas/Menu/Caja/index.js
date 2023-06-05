const rutas = require("express").Router();
const oficina = require("../../../controllers/oficina");

const cajaAbierta = require("../../../middleware/cajaAbierta");

const cuenta_usuario = require("../../../controllers/cuenta_usuario");
const habilitacion = require("../../../controllers/habilitacion");
const notificaciones = require("../../../controllers/notificaciones");
const caja_trabajo = require("../../../controllers/caja_trabajo");
const moneda_denominacion = require("../../../controllers/moneda_denominacion");
const autenticacion = require("../../../middleware/autenticacionCaja");
const logBody = require("../../../middleware/logBody");
//agregue desde aqui tipo conexion
const tipoCone = require("../../../middleware/tipoConexion");

// const transferencias = require("./Transferencias");
const pagoServicios = require("./PagoServicios");
const egresoCuentaServicios = require("./EgresoCuentaServicios");
// // const transferenciasCentral = require("./TransferenciasCentral");
const ordenpago = require("./OrdenPago");
const pagarBancos = require("./PagarBancos");
const subirfotos = require("./SubirFotos");
const verificarfotos = require("./VerificarFoto");
const autorizaroperaciones = require("./AutorizarOperaciones");
const habilitaciones = require("./Habilitaciones");
const cuentaCorrienteCliente = require("./CuentaCorrienteCliente");
const tipocambio = require("./TipoCambio");
const materiales = require("./Material")
const recibointerno = require("./ReciboInterno");
const extornar = require("./Extorno");
const extornarCentral = require("./ExtornoCentral");
const operacionesCaja = require("./OperacionesCaja");
const abrirCerrarCajas = require("./AbrirCerrarCajas");
const cerrarcaja = require("./CerrarCaja");

//
rutas.post("/logincaja",cuenta_usuario.validarCaja);
rutas.post("/logincaja/cerrarcaja", caja_trabajo.cerrarCaja);
rutas.get("/logincaja/monedadenominacion/listar", moneda_denominacion.listar);
rutas.post("/logincaja/verificarsaldos", caja_trabajo.verificarSaldos);
rutas.use(logBody());
rutas.get("/listarnotificaciones", notificaciones.buscar);
rutas.get("/obtenersaldos", caja_trabajo.obtenerSaldosCajaAnterior);
rutas.get("/obtenersaldosfecha", caja_trabajo.obtenerSaldosFecha);
rutas.use(autenticacion());
rutas.use(cajaAbierta());

//obtiene las habilitaciones para una caja en especifico
rutas.get("/habilitacioneslistar/listar", habilitacion.listar);
rutas.get("/oficina/listar/activas", oficina.listarOficinasActivas);
//SUBRUTAS
// // rutas.use("/transferencias", transferencias);
rutas.use("/pagoservicios", pagoServicios);
rutas.use("/egresocuentaservicios", egresoCuentaServicios);
// // rutas.use("/transferenciascentral", transferenciasCentral);
rutas.use("/ordenpago", ordenpago);
rutas.use("/pagarbancos", pagarBancos);
rutas.use("/subirfotos", subirfotos);
rutas.use("/verificarfotos", verificarfotos);
rutas.use("/autorizaroperaciones", autorizaroperaciones);
rutas.use("/habilitaciones", habilitaciones);
rutas.use("/cuentacorrientecliente", cuentaCorrienteCliente);
rutas.use("/tipocambio", tipocambio);
rutas.use("/materiales", materiales);
rutas.use("/recibointerno", recibointerno);
//rutas.use("/extornar", extornar);
//rutas.use("/extornarcentral", extornarCentral);
rutas.use("/abrircerrarcajas", abrirCerrarCajas);
rutas.use("/operacionescaja", operacionesCaja);
rutas.use("/cerrarcaja", cerrarcaja);

//RUTAS DIRECTAS

module.exports = rutas;
