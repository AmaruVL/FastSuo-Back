const rutas_cuentas = require("express").Router();
const cuentasUsuario = require("../../../../controllers/cuenta_usuario");
const verificarPerfil = require("../../../../middleware/verificarPerfil");

rutas_cuentas.get("/listar", [verificarPerfil(1)], cuentasUsuario.listar);
rutas_cuentas.get("/buscar/:usuario", [verificarPerfil(2)], cuentasUsuario.buscar);
rutas_cuentas.post("/", [verificarPerfil(3)], cuentasUsuario.crear);
rutas_cuentas.put(
  "/actualizar/:usuario",
  [verificarPerfil(4)],
  cuentasUsuario.actualizar,
);
rutas_cuentas.put(
  "/desactivar/:usuario",
  [verificarPerfil(5)],
  cuentasUsuario.desactivar,
);
rutas_cuentas.delete("/eliminar/:usuario", [verificarPerfil(6)], cuentasUsuario.eliminar);

module.exports = rutas_cuentas;
