const rutas_cuentas = require("express").Router();
const cuentas = require("../../../../controllers/cuenta");
const verificarPerfil = require("../../../../middleware/verificarPerfil");

rutas_cuentas.get("/listar", [verificarPerfil(1)], cuentas.listar);
rutas_cuentas.get("/buscar/:cuenta_codigo", [verificarPerfil(2)], cuentas.buscar);
rutas_cuentas.post("/", [verificarPerfil(3)], cuentas.crear);
rutas_cuentas.put("/actualizar/:cuenta_codigo", [verificarPerfil(4)], cuentas.actualizar);
rutas_cuentas.put("/desactivar/:cuenta_codigo", [verificarPerfil(5)], cuentas.desactivar);
rutas_cuentas.delete("/eliminar/:cuenta_codigo", [verificarPerfil(6)], cuentas.eliminar);

module.exports = rutas_cuentas;