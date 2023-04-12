const rutas_trasferencias = require("express").Router();

const operacion_cuenta = require("../../../../controllers/operacion_cuenta");
const oficina = require("../../../../controllers/oficina");
const documentoserie = require("../../../../controllers/documento_serie");
const entidadbancaria = require("../../../../controllers/entidad_financiera_servicios");
const cuenta_corriente = require("../../../../controllers/cuenta_corriente");
const verificarPerfil = require("../../../../middleware/verificarPerfil");
const verificarOficina = require("../../../../middleware/verificarOficina");
const verificarDT = require("../../../../middleware/verificarDT");

//NIVEL >=3
rutas_trasferencias.use(verificarPerfil(3));
rutas_trasferencias.post("/", operacion_cuenta.egresoCuentaServicio); //guardaTransferencias
rutas_trasferencias.get("/nrosiguienteoperacion/:documento_codigo/:documento_serie", operacion_cuenta.nroSiguienteOperacion); //listarOficinas
rutas_trasferencias.get("/oficina/listar/activas", oficina.listarOficinasActivas); //listarOficinas
rutas_trasferencias.get("/listarcuentasservicios", cuenta_corriente.listarcuentasservicios); //listarOficinas
rutas_trasferencias.get("/entidadbancaria", entidadbancaria.listar); //listar Entidad Bancaria
rutas_trasferencias.get("/documentoserie", documentoserie.listarActivos); //listar Entidad Bancaria

module.exports = rutas_trasferencias;
