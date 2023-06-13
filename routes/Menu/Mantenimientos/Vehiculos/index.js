const rutasVehiculos = require('express').Router();
const vehiculos = require('../../../../controllers/vehiculo');
const verificarPerfil = require('../../../../middleware/verificarPerfil');

rutasVehiculos.get('/listar', [verificarPerfil(1)], vehiculos.listar);
rutasVehiculos.get('/buscar/:id_vehiculo', [verificarPerfil(2)], vehiculos.buscar);
rutasVehiculos.post('/', [verificarPerfil(3)], vehiculos.crear);
rutasVehiculos.put(
  '/actualizar/:id_vehiculo',
  [verificarPerfil(4)],
  vehiculos.actualizar,
);
rutasVehiculos.delete('/eliminar/:id_vehiculo', [verificarPerfil(6)], vehiculos.eliminar);

module.exports = rutasVehiculos;
