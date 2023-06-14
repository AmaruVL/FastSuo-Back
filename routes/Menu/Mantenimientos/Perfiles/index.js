const rutas_cuentas = require('express').Router();
const perfiles = require('../../../../controllers/perfil');
const menu = require('../../../../controllers/menu_acceso');
const verificarPerfil = require('../../../../middleware/verificarPerfil');

rutas_cuentas.get('/listar', [verificarPerfil(1)], perfiles.listar);
rutas_cuentas.get('/buscar/:perfil_codigo', [verificarPerfil(2)], perfiles.buscar);
//
rutas_cuentas.post('/', [verificarPerfil(3)], perfiles.crear);
rutas_cuentas.get('/menuacceso', [verificarPerfil(3)], menu.listar);
//
rutas_cuentas.put(
  '/actualizar/:perfil_codigo',
  [verificarPerfil(4)],
  perfiles.actualizar,
);
rutas_cuentas.put(
  '/desactivar/:perfil_codigo',
  [verificarPerfil(5)],
  perfiles.desactivar,
);
rutas_cuentas.delete('/eliminar/:perfil_codigo', [verificarPerfil(6)], perfiles.eliminar);

module.exports = rutas_cuentas;
