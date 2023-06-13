const rutasConductores = require('express').Router();
const conductores = require('../../../../controllers/conductor');
const verificarPerfil = require('../../../../middleware/verificarPerfil');

rutasConductores.get('/listar', [verificarPerfil(1)], conductores.listar);
rutasConductores.get('/buscar/:nro_brevete', [verificarPerfil(2)], conductores.buscar);
rutasConductores.post('/', [verificarPerfil(3)], conductores.crear);
rutasConductores.put(
  '/actualizar/:nro_brevete',
  [verificarPerfil(4)],
  conductores.actualizar,
);
rutasConductores.delete(
  '/eliminar/:nro_brevete',
  [verificarPerfil(6)],
  conductores.eliminar,
);

module.exports = rutasConductores;
