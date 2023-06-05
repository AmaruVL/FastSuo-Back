// const rutas_trasferencias = require("express").Router();
// const oficina = require("../../../../controllers/oficina");
// const caja = require("../../../../controllers/caja");
// const cliente = require("../../../../controllers/cliente_proveedor");
// const habilitacion = require("../../../../controllers/habilitacion");
// const documentoserie = require("../../../../controllers/documento_serie");
// const verificarPerfil = require("../../../../middleware/verificarPerfil");
// const verificarOficina = require("../../../../middleware/verificarOficina");
// const verificarCaja = require("../../../../middleware/verificarCaja");
// const verificarSaldoOficina = require("../../../../middleware/verificarSaldoOficina");

// rutas_trasferencias.use(verificarPerfil(1));
// rutas_trasferencias.get("/listar", habilitacion.listar); //guardaTransferencias
// rutas_trasferencias.get("/listar/realizadas", habilitacion.listarRealizadas); //guardaTransferencias.
// rutas_trasferencias.use(verificarPerfil(2));
// rutas_trasferencias.put("/aceptar", [verificarOficina.verificarOfOrigen(), verificarSaldoOficina()], habilitacion.aceptar); //guardaTransferencias
// rutas_trasferencias.use(verificarPerfil(3));
// rutas_trasferencias.get("/documentoserie", documentoserie.listarActivos); //guardaTransferencias
// rutas_trasferencias.get("/anular/documentoserie", documentoserie.listarRecibosIngreso); //guardaTransferencias
// rutas_trasferencias.get("/anularamortizacion/documentoserie", documentoserie.listarRecibosEgreso); //guardaTransferencias
// rutas_trasferencias.post("/", [verificarOficina.verificarOfOrigen()],[verificarCaja.verificarCajaDestino()], habilitacion.crear); //guardaTransferencias
// rutas_trasferencias.get("/oficina/listar/activas", oficina.listarOficinasActivas); //listarOficinas
// rutas_trasferencias.get("/oficina/buscar/:oficina_codigo/caja", caja.listarPor); //listarOficinas
// rutas_trasferencias.post("/amortizacion", [verificarOficina.verificarOfOrigen()], habilitacion.amortizacion); //Crea una Amortizacion
// rutas_trasferencias.use(verificarPerfil(4));
// rutas_trasferencias.post("/anular", habilitacion.anular); //guardaTransferencias
// rutas_trasferencias.post("/anularamortizacion", habilitacion.anularAmortizacion); //guardaTransferencias

// //rutas_trasferencias.get("/cliente/:valorBusqueda", cliente.buscar); //buscar cliente

// module.exports = rutas_trasferencias;
