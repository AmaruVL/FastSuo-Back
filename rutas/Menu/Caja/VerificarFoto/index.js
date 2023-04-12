const rutas_trasferencias = require("express").Router();
const transferencia = require("../../../../controllers/transferencia");
const oficina = require("../../../../controllers/oficina");

const verificarPerfil = require("../../../../middleware/verificarPerfil");

rutas_trasferencias.use(verificarPerfil(3));
rutas_trasferencias.get("/oficina/listar/activas", oficina.listarOficinasActivas); //guardarTIpo de  cambio
rutas_trasferencias.get("/buscar/:query/:fechaInicio/:fechaFin/:oficina_origen/:oficina_destino/:estado/:importe", transferencia.buscarFotos); //guardaTransferencias
rutas_trasferencias.put("/verificarfoto", transferencia.verificarfoto); //guardaTransferencias

module.exports = rutas_trasferencias;
