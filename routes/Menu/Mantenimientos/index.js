const rutas = require('express').Router();
const logBody = require('../../../middleware/logBody');
const administrados = require('./Administrados');
const perfiles = require('./Perfiles');
const usuarios = require('./Usuarios');
const configuracion = require('./Configuracion');
const menuAccesos = require('./MenuAccesos');

// SUBRUTAS
rutas.use(logBody());
rutas.use('/usuarios', usuarios);
rutas.use('/administrados', administrados);
rutas.use('/menuaccesos', menuAccesos);
rutas.use('/perfiles', perfiles);
rutas.use('/configuracion', configuracion);
// RUTAS DIRECTAS

module.exports = rutas;
