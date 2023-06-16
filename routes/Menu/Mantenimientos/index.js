const rutas = require('express').Router();
const logBody = require('../../../middleware/logBody');
const personas = require('./Personas');
const perfiles = require('./Perfiles');
const usuarios = require('./Usuarios');
const configuracion = require('./Configuracion');
const menuAccesos = require('./MenuAccesos');
const conductores = require('./Conductores');
const vehiculos = require('./Vehiculos');

// SUBRUTAS
rutas.use(logBody());
rutas.use('/usuarios', usuarios);
rutas.use('/personas', personas);
rutas.use('/menuaccesos', menuAccesos);
rutas.use('/perfiles', perfiles);
rutas.use('/vehiculos', vehiculos);
rutas.use('/conductores', conductores);
rutas.use('/configuracion', configuracion);
// RUTAS DIRECTAS

module.exports = rutas;
