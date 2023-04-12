const rutas_cuentas = require("express").Router();
const cuentaCorriente = require("../../../../controllers/cuenta_corriente");
const oficina = require("../../../../controllers/oficina");
const entidadesfinancieras = require("../../../../controllers/entidad_financiera_servicios");
const cliente_proveedor = require("../../../../controllers/cliente_proveedor");
const verificarPerfil = require("../../../../middleware/verificarPerfil");

rutas_cuentas.get("/listar", [verificarPerfil(1)], cuentaCorriente.listar);
rutas_cuentas.get("/buscar/:id_cuenta", [verificarPerfil(2)], cuentaCorriente.buscar);
rutas_cuentas.post("/", [verificarPerfil(3)], cuentaCorriente.crear);
rutas_cuentas.get("/buscardni/:id_cliente", [verificarPerfil(3)], cliente_proveedor.buscar);
rutas_cuentas.get("/correlativo/:oficina_codigo/:tipo_cta", [verificarPerfil(3)], cuentaCorriente.correlativo);
rutas_cuentas.get("/oficina/listar/activas", [verificarPerfil(3)], oficina.listarOficinasActivas);
rutas_cuentas.get("/entidadesfinancieras/listar", [verificarPerfil(3)], entidadesfinancieras.listar);
rutas_cuentas.put("/actualizar/:id_cuenta", [verificarPerfil(4)], cuentaCorriente.actualizar);
rutas_cuentas.put("/desactivar/:id_cuenta", [verificarPerfil(5)], cuentaCorriente.desactivar);
rutas_cuentas.delete("/eliminar/:id_cuenta", [verificarPerfil(6)], cuentaCorriente.eliminar);

module.exports = rutas_cuentas;
