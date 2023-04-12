const rutas_trasferencias = require("express").Router();

const transferencia = require("../../../../controllers/transferencia");
const utils = require("../../../../controllers/utils");
const transferenciaCentral = require("../../../../controllers/transferenciasCentral");
const oficina = require("../../../../controllers/oficina");
const documentoserie = require("../../../../controllers/documento_serie");
const cliente = require("../../../../controllers/cliente_proveedor");
const comision = require("../../../../controllers/comision");
const entidadbancaria = require("../../../../controllers/entidad_financiera_servicios");
const verificarPerfil = require("../../../../middleware/verificarPerfil");
const verificarOficina = require("../../../../middleware/verificarOficina");
const verificarDT = require("../../../../middleware/verificarDT");
const verificarUsuarioAuthPago = require("../../../../middleware/verificarUsuarioAuthPago");

//ORDEN DE PAGO
//NIVEL >= 1
rutas_trasferencias.use(verificarPerfil(1));
rutas_trasferencias.get("/buscar/:query/:fechaInicio/:fechaFin/:oficina_origen/:oficina_destino/:estado", transferencia.buscarcentral); //guardaTransferencias
//NIVEL >= 3
rutas_trasferencias.use(verificarPerfil(3));
rutas_trasferencias.get("/op/documentoserie", documentoserie.listarActivos); //guardaTransferencias
//TRANSFERENCIA
//NIVEL >=3
rutas_trasferencias.get("/nrosiguienteoperacion/:oficina_codigo", transferencia.nroSiguienteOperacionOficina); //listarOficinas
rutas_trasferencias.get("/oficina/listar/activas", oficina.listarOficinasActivas); //listarOficinas
rutas_trasferencias.get("/comision/listar", comision.listar);
rutas_trasferencias.get("/cliente/:id_cliente", cliente.buscar); //buscar cliente
rutas_trasferencias.get("/entidadbancaria", entidadbancaria.listar); //listar Entidad Bancaria
rutas_trasferencias.get("/documentoserie", documentoserie.listarActivos); //listar Entidad Bancaria
rutas_trasferencias.put("/cliente/:id_cliente", cliente.actualizar); //actualiza datos del cliente
rutas_trasferencias.put("/autorizarpago", [verificarUsuarioAuthPago.verificar()], transferencia.autorizarPago); //actualiza datos del cliente
rutas_trasferencias.put("/dictar", transferencia.dictarTransferencia); //actualiza datos del cliente
rutas_trasferencias.get("/codvalidacionintercambio", utils.codValidacionIntercambio); //actualiza datos del cliente

rutas_trasferencias.post(
  "/",
  [verificarOficina.verificarOfOrigenCentral(), verificarOficina.verificarOfDestinoCentral(), verificarDT.verificarDTtransferenciaCentral()],
  transferenciaCentral.crearCentral
); //guardaTransferencias
rutas_trasferencias.post("/cancelar", transferenciaCentral.cancelarCentral); //guardaTransferencias

//NIVEL >= 4
rutas_trasferencias.use(verificarPerfil(4));
rutas_trasferencias.post("/anular", [verificarOficina.verificarOfOrigenCentral()], transferenciaCentral.realizarAnulacion); //guardaTransferencias
rutas_trasferencias.put("/realizardevolucion", transferenciaCentral.realizarDevolucion); //guardaTransferencias
rutas_trasferencias.put("/realizarreembolso", transferenciaCentral.realizarReembolso); //guardaTransferencias
rutas_trasferencias.put("/realizarcambiodestino", transferenciaCentral.realizarCambioDestino); //guardaTransferencias
rutas_trasferencias.put("/realizarcambiobeneficiario", transferenciaCentral.realizarCambioBeneficiario); //guardaTransferencias
//rutas_trasferencias.put("/realizarextorno", transferenciaCentral.realizarExtorno); //guardaTransferencias
rutas_trasferencias.put("/cambiooficinacentropoblado", transferenciaCentral.cambiooficinacentropoblado);
rutas_trasferencias.get("/anular/documentoserie", documentoserie.listarDocumentoRI); //guardaTransferencias

module.exports = rutas_trasferencias;
