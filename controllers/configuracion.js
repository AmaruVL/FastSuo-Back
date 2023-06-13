const Sequelize = require('sequelize');
const models = require('../models');
const cache = require('../config/cache');

const filename = module.filename.split('/').slice(-1);

exports.crear = (req, res) => {
  const logger = req.app.get('winston');
  const token = req.header('Authorization').split(' ')[1];
  models.configuracion
    .create({
      clave: req.body.clave,
      valor: req.body.valor,
    })
    .then((objeto) => {
      res.json(objeto);
    })
    .catch((err) => {
      logger.log('error', {
        ubicacion: filename,
        token,
        message: { mensaje: err.message, tracestack: err.stack },
      });
      res.status(412).send(err);
    });
};

exports.buscar = (req, res) => {
  const logger = req.app.get('winston');
  const token = req.header('Authorization').split(' ')[1];
  models.configuracion
    .findByPk(req.params.clave)
    .then((objeto) => {
      res.json(objeto);
    })
    .catch((err) => {
      logger.log('error', {
        ubicacion: filename,
        token,
        message: { mensaje: err.message, tracestack: err.stack },
      });
      res.status(412).send(err);
    });
};

exports.actualizar = (req, res) => {
  const logger = req.app.get('winston');
  const token = req.header('Authorization').split(' ')[1];
  models.configuracion
    .update(
      {
        valor: req.body.valor,
      },
      {
        where: {
          clave: req.params.clave,
        },
      },
    )
    .then((filasAfectadas) => {
      cache.delValue(req.params.clave);
      res.json({
        mensaje: filasAfectadas,
      });
    })
    .catch((err) => {
      logger.log('error', {
        ubicacion: filename,
        token,
        message: { mensaje: err.message, tracestack: err.stack },
      });
      res.status(412).send(err);
    });
};

exports.listar = (req, res) => {
  const logger = req.app.get('winston');
  const token = req.header('Authorization').split(' ')[1];
  models.configuracion
    .findAll({})
    .then((lista) => {
      res.json(lista);
    })
    .catch((err) => {
      logger.log('error', {
        ubicacion: filename,
        token,
        message: { mensaje: err.message, tracestack: err.stack },
      });
      res.status(412).send(err);
    });
};

exports.listarConf = (req, res) => {
  const logger = req.app.get('winston');
  const token = req.header('Authorization').split(' ')[1];
  models.configuracion
    .findAll({
      attributes: ['clave', 'valor'],
    })
    .then((lista) => {
      res.json(lista);
    })
    .catch((err) => {
      logger.log('error', {
        ubicacion: filename,
        token,
        message: { mensaje: err.message, tracestack: err.stack },
      });
      res.status(412).send(err);
    });
};

exports.eliminar = (req, res) => {
  const logger = req.app.get('winston');
  const token = req.header('Authorization').split(' ')[1];
  models.configuracion
    .destroy({
      where: {
        clave: req.params.clave,
      },
    })
    .then((respuesta) => {
      res.json({
        mensaje: respuesta,
      });
    })
    .catch((err) => {
      logger.log('error', {
        ubicacion: filename,
        token,
        message: { mensaje: err.message, tracestack: err.stack },
      });
      res.status(409).send(err);
    });
};
