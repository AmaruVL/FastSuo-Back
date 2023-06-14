const models = require('../models');

const filename = module.filename.split('/').slice(-1);

exports.listar = (req, res) => {
  const logger = req.app.get('winston');
  const token = req.header('Authorization').split(' ')[1];
  models.menu_acceso
    .findAll({
      order: [['modulo'], ['nivel']],
      attributes: [
        'menu_codigo',
        'menu_etiqueta',
        'descripcion',
        'nivel',
        'modulo',
        'tipo_modulo',
        'imagen',
        'ambito_acceso',
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
  models.menu_acceso
    .findByPk(req.params.menu_codigo)
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
  models.menu_acceso
    .create({
      menu_codigo: req.body.menu_codigo,
      menu_etiqueta: req.body.menu_etiqueta,
      descripcion: req.body.descripcion,
      nivel: req.body.nivel,
      modulo: req.body.modulo,
      tipo_modulo: req.body.tipo_modulo,
      imagen: req.body.imagen,
      ambito_acceso: req.body.ambito_acceso,
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
  models.menu_acceso
    .update(
      {
        menu_etiqueta: req.body.menu_etiqueta,
        descripcion: req.body.descripcion,
        nivel: req.body.nivel,
        modulo: req.body.modulo,
        tipo_modulo: req.body.tipo_modulo,
        imagen: req.body.imagen,
        ambito_acceso: req.body.ambito_acceso,
      },
      {
        where: {
          menu_codigo: req.params.menu_codigo,
        },
      },
    )
    .then(() => {
      res.json({
        mensaje: 'exito',
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
  models.menu_acceso
    .destroy({
      where: {
        menu_codigo: req.params.menu_codigo,
      },
    })
    .then(() => {
      res.json({
        mensaje: 'eliminado',
      });
    })
    .catch((err) => {
      logger.log('error', { ubicacion: filename, token, message: err.message });
      res.status(400).json({
        error: err.errors,
      });
    });
};
