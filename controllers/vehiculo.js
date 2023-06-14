const models = require('../models');

const filename = module.filename.split('/').slice(-1);

exports.listar = (req, res) => {
  const logger = req.app.get('winston');
  const token = req.header('Authorization').split(' ')[1];

  models.vehiculo
    .findAll({
      order: [['placa', 'ASC']],
      attributes: ['id_vehiculo', 'placa', 'marca', 'clase', 'modelo', 'color'],
    })
    .then((lista) => {
      res.json(lista);
    })
    .catch((err) => {
      logger.log('error', { ubicacion: filename, token, message: err.message });
      res.json({
        error: err.errors,
      });
    });
};

exports.buscar = (req, res) => {
  const logger = req.app.get('winston');
  const token = req.header('Authorization').split(' ')[1];

  models.vehiculo
    .findByPk(req.params.id_vehiculo)
    .then((objeto) => {
      res.json(objeto);
    })
    .catch((err) => {
      logger.log('error', { ubicacion: filename, token, message: err.message });
      res.status(400).json({
        error: err.errors,
      });
    });
};

exports.crear = (req, res) => {
  const logger = req.app.get('winston');
  const token = req.header('Authorization').split(' ')[1];

  models.vehiculo
    .create({
      placa: req.body.placa,
      marca: req.body.marca,
      clase: req.body.clase,
      modelo: req.body.modelo,
      color: req.body.color,
    })
    .then((objeto) => {
      res.json({
        mensaje: objeto,
      });
    })
    .catch((err) => {
      logger.log('error', { ubicacion: filename, token, message: err.message });
      res.status(400).json({
        error: err.errors,
      });
    });
};

exports.actualizar = (req, res) => {
  const logger = req.app.get('winston');
  const token = req.header('Authorization').split(' ')[1];

  models.vehiculo
    .update(
      {
        placa: req.body.placa,
        marca: req.body.marca,
        clase: req.body.clase,
        modelo: req.body.modelo,
        color: req.body.color,
      },
      {
        where: {
          id_vehiculo: req.params.id_vehiculo,
        },
      },
    )
    .then(() => {
      res.json({
        mensaje: 'Actualizado',
      });
    })
    .catch((err) => {
      logger.log('error', { ubicacion: filename, token, message: err.message });
      res.status(400).json({
        error: err.errors,
      });
    });
};

exports.eliminar = (req, res) => {
  const logger = req.app.get('winston');
  const token = req.header('Authorization').split(' ')[1];

  models.vehiculo
    .destroy({
      where: {
        id_vehiculo: req.params.id_vehiculo,
      },
    })
    .then(() => {
      res.json({
        mensaje: 'Eliminado',
      });
    })
    .catch((err) => {
      logger.log('error', { ubicacion: filename, token, message: err.message });
      res.status(400).json({
        error: err.errors,
      });
    });
};
