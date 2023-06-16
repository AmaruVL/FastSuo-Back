const rutas_administrados = require('express').Router();
const administrados = require('../../../../controllers/persona');
const verificarPerfil = require('../../../../middleware/verificarPerfil');

rutas_administrados.get('/listar', [verificarPerfil(1)], administrados.listar);
rutas_administrados.get(
  '/buscar/:id_persona',
  [verificarPerfil(2)],
  administrados.buscar,
);
rutas_administrados.get(
  '/buscarnombre/:nombre',
  [verificarPerfil(2)],
  administrados.buscarNombre,
);

rutas_administrados.post('/', [verificarPerfil(3)], administrados.crear);
rutas_administrados.put(
  '/actualizar/:id_persona',
  [verificarPerfil(4)],
  administrados.actualizar,
);
rutas_administrados.delete(
  '/eliminar/:id_persona',
  [verificarPerfil(6)],
  administrados.eliminar,
);

module.exports = rutas_administrados;
