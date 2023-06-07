const rutas = require("express").Router();
const logBody = require("../../../middleware/logBody");
const administrados = require("./Clientes");
const cuentasSunat = require("./CuentasSunat");
const documentos = require("./Documentos");
const empresas = require("./Empresas");
const centroCosto = require("./CentroCosto");
const entidadFinanciera = require("./EntidadesFinancieras");
const perfiles = require("./Perfiles");
const usuarios = require("./Usuarios");
const cuentaCorriente = require("./CuentasCorrientes");
const configuracion = require("./Configuracion");
const centroPoblado = require("./CentroPoblado");
const menuAccesos = require("./MenuAccesos");

//SUBRUTAS
rutas.use("/usuarios", usuarios);
rutas.use(logBody());
rutas.use("/administrados", administrados);
rutas.use("/cuentassunat", cuentasSunat);
rutas.use("/documentos", documentos);
rutas.use("/empresas", empresas);
rutas.use("/centrocosto", centroCosto);
rutas.use("/entidadesfinancieras", entidadFinanciera);
rutas.use("/menuaccesos", menuAccesos);
rutas.use("/perfiles", perfiles);
rutas.use("/cuentacorriente", cuentaCorriente);
rutas.use("/configuracion", configuracion);
rutas.use("/centrospoblados", centroPoblado);
//RUTAS DIRECTAS

module.exports = rutas;
