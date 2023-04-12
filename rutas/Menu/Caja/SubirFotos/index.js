const rutas_trasferencias = require("express").Router();
const transferencia = require("../../../../controllers/transferencia");

const verificarPerfil = require("../../../../middleware/verificarPerfil");

rutas_trasferencias.use(verificarPerfil(3));
rutas_trasferencias.get("/listarpagadas", transferencia.listarPagadasdelDia); //guardarTIpo de  cambio
rutas_trasferencias.post("/guardarimagen", transferencia.guardarimagen); //guardarTIpo de  cambio
rutas_trasferencias.get("/buscarop_id/:in_nro_operacion",transferencia.buscarPagadaporid);
module.exports = rutas_trasferencias;
