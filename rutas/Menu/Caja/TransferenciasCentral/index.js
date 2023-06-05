// const rutas_trasferencias = require("express").Router();

// const utils = require("../../../../controllers/utils");
// const oficina = require("../../../../controllers/oficina");
// const documentoserie = require("../../../../controllers/documento_serie");
// const cliente = require("../../../../controllers/cliente_proveedor");
// const comision = require("../../../../controllers/comision");
// const verificarPerfil = require("../../../../middleware/verificarPerfil");
// const verificarOficina = require("../../../../middleware/verificarOficina");
// const verificarDT = require("../../../../middleware/verificarDT");
// const verificarUsuarioAuthPago = require("../../../../middleware/verificarUsuarioAuthPago");

// //ORDEN DE PAGO
// //NIVEL >= 1
// rutas_trasferencias.use(verificarPerfil(1));
// //NIVEL >= 3
// rutas_trasferencias.use(verificarPerfil(3));
// //NIVEL >=3
// rutas_trasferencias.get("/oficina/listar/activas", oficina.listarOficinasActivas); //listarOficinas
// rutas_trasferencias.get("/comision/listar", comision.listar);
// rutas_trasferencias.get("/cliente/:id_cliente", cliente.buscar); //buscar cliente
// rutas_trasferencias.get("/documentoserie", documentoserie.listarActivos); //listar Entidad Bancaria
// rutas_trasferencias.put("/cliente/:id_cliente", cliente.actualizar); //actualiza datos del cliente
// rutas_trasferencias.get("/codvalidacionintercambio", utils.codValidacionIntercambio); //actualiza datos del cliente

// rutas_trasferencias.post(
//   "/",

// //NIVEL >= 4
// rutas_trasferencias.use(verificarPerfil(4));

// module.exports = rutas_trasferencias;
