const rutas_trasferencias = require("express").Router();

const transferencia = require("../../../../controllers/transferencia");
const oficina = require("../../../../controllers/oficina");
const documentoserie = require("../../../../controllers/documento_serie");
const cliente = require("../../../../controllers/cliente_proveedor");
const verificarPerfil = require("../../../../middleware/verificarPerfil");
const verificarOficina = require("../../../../middleware/verificarOficina");
const verificarDT = require("../../../../middleware/verificarDT");
const verificarSaldoOficina = require("../../../../middleware/verificarSaldoOficina");

//NIVEL >=3
rutas_trasferencias.use(verificarPerfil(3));
rutas_trasferencias.post(
  "/",
  [verificarOficina.verificarOfOrigen(), verificarOficina.verificarOfDestino(), verificarDT.verificarDTtransferencia(), verificarSaldoOficina()],
  transferencia.crear
); //guardaTransferencias
rutas_trasferencias.get("/nrosiguienteoperacion/:documento_codigo/:documento_serie", transferencia.nroSiguienteOperacion); //listarOficinas
rutas_trasferencias.get("/oficina/listar/activas", oficina.listarOficinasActivas); //listarOficinas
rutas_trasferencias.get("/cliente/:id_cliente", cliente.buscar); //buscar cliente
rutas_trasferencias.get("/documentoserie", documentoserie.listarActivos); //listar Entidad Bancaria
rutas_trasferencias.put("/cliente/:id_cliente", cliente.actualizar); //actualiza datos del cliente

module.exports = rutas_trasferencias;
