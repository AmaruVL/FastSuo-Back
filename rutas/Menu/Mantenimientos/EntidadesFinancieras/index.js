const rutas_cuentas = require("express").Router();
const entidadFinanciera = require("../../../../controllers/entidad_financiera_servicios");
const cuenta = require("../../../../controllers/cuenta");
const verificarPerfil = require("../../../../middleware/verificarPerfil");

rutas_cuentas.get("/listar", [verificarPerfil(1)], entidadFinanciera.listar);
rutas_cuentas.get("/buscar/:entidad_codigo", [verificarPerfil(2)], entidadFinanciera.buscar);
rutas_cuentas.post("/", [verificarPerfil(3)], entidadFinanciera.crear);
rutas_cuentas.get("/listar/cuentas/activas", [verificarPerfil(3)], cuenta.listarActivas);
rutas_cuentas.put("/actualizar/:entidad_codigo", [verificarPerfil(4)], entidadFinanciera.actualizar);
//rutas_cuentas.put("/desactivar/:cuenta_codigo", entidadFinanciera.desactivar);
rutas_cuentas.delete("/eliminar/:entidad_codigo", [verificarPerfil(6)], entidadFinanciera.eliminar);

module.exports = rutas_cuentas;
