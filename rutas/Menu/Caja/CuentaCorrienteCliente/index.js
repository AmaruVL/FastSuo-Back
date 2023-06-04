const rutas_trasferencias = require("express").Router();

const oficina = require("../../../../controllers/oficina");
const documentoserie = require("../../../../controllers/documento_serie");
const entidadbancaria = require("../../../../controllers/entidad_financiera_servicios");
const cuenta_corriente = require("../../../../controllers/cuenta_corriente");
const verificarPerfil = require("../../../../middleware/verificarPerfil");
const verificarOficina = require("../../../../middleware/verificarOficina");
const verificarDT = require("../../../../middleware/verificarDT");

//NIVEL >=3
rutas_trasferencias.use(verificarPerfil(3));
rutas_trasferencias.get("/documentoserie", documentoserie.listarActivos); //listar Entidad Bancaria
rutas_trasferencias.get("/buscarcuenta/:id_cliente", cuenta_corriente.buscarCuentaCliente);

module.exports = rutas_trasferencias;
