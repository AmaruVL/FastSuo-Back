const models = require('../models');

const filename = module.filename.split('/').slice(-1);

exports.listar = (req, res) => {
  const logger = req.app.get('winston');
  const token = req.header('Authorization').split(' ')[1];

  models.conductor
    .findAll({
      order: [['nro_brevete', 'ASC']],
      attributes: [
        'nro_brevete',
        'nro_licencia_correlativo',
        'estado',
        'fecha_expedicion',
        'fecha_revalidacion',
        'restricciones',
      ],
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

  models.conductor
    .findByPk(req.params.nro_brevete)
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

  models.conductor
    .create({
      nro_brevete: req.body.nro_brevete,
      nro_licencia_correlativo: req.body.nro_licencia_correlativo,
      estado: req.body.estado,
      fecha_expedicion: req.body.fecha_expedicion,
      fecha_revalidacion: req.body.fecha_revalidacion,
      restricciones: req.body.restricciones,
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

  models.conductor
    .update(
      {
        nro_licencia_correlativo: req.body.nro_licencia_correlativo,
        estado: req.body.estado,
        fecha_expedicion: req.body.fecha_expedicion,
        fecha_revalidacion: req.body.fecha_revalidacion,
        restricciones: req.body.restricciones,
      },
      {
        where: {
          nro_brevete: req.params.nro_brevete,
        },
      },
    )
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

exports.eliminar = (req, res) => {
  const logger = req.app.get('winston');
  const token = req.header('Authorization').split(' ')[1];

  models.conductor
    .destroy({
      where: {
        nro_brevete: req.params.nro_brevete,
      },
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
