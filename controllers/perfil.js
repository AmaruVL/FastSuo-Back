const { Op } = require('sequelize');
const models = require('../models');
const cache = require('../config/cache');

const filename = module.filename.split('/').slice(-1);

exports.crear = (req, res) => {
  const logger = req.app.get('winston');
  const token = req.header('Authorization').split(' ')[1];
  models.perfil
    .create({
      perfil_codigo: req.body.perfil_codigo,
      perfil_nombre: req.body.perfil_nombre,
      descripcion: req.body.descripcion,
      icono: req.body.icono,
      estado_registro: req.body.estado_registro,
    })
    .then((perfil) => {
      const lista_menu = req.body.lista_menus;
      const nueva_lista = [];
      lista_menu.forEach(({ menu_codigo, nivel_acceso }) => {
        nueva_lista.push({
          perfil_codigo: req.body.perfil_codigo,
          menu_codigo,
          nivel_acceso,
        });
      });
      models.lista_menu
        .bulkCreate(nueva_lista, {
          returning: true,
        })
        .then(() => {
          res.json(perfil);
        })
        .catch((err) => {
          logger.log('error', {
            ubicacion: filename,
            token,
            message: { mensaje: err.message, tracestack: err.stack },
          });
          res.status(400).send(err);
        });
    })
    .catch((err) => {
      logger.log('error', {
        ubicacion: filename,
        token,
        message: { mensaje: err.message, tracestack: err.stack },
      });
      res.status(400).send(err);
    });
};

exports.buscar = (req, res) => {
  const logger = req.app.get('winston');
  const token = req.header('Authorization').split(' ')[1];
  models.perfil
    .findByPk(req.params.perfil_codigo, {
      include: {
        model: models.lista_menu,
        required: true,
        attributes: ['menu_codigo', 'nivel_acceso'],
        where: {
          nivel_acceso: {
            [Op.gt]: 0, // Greater than (>)
          },
        },
      },
    })
    .then((objeto) => {
      if (!objeto) {
        res.status(404).json({ message: 'No existe perfil' });
      }
      res.json(objeto);
    })
    .catch((err) => {
      logger.log('error', {
        ubicacion: filename,
        token,
        message: { mensaje: err.message, tracestack: err.stack },
      });
      res.status(404).json(err);
    });
};

exports.actualizar = (req, res) => {
  const logger = req.app.get('winston');
  const token = req.header('Authorization').split(' ')[1];
  models.perfil
    .update(
      {
        perfil_nombre: req.body.perfil_nombre,
        descripcion: req.body.descripcion,
        icono: req.body.icono,
      },
      {
        where: {
          perfil_codigo: req.params.perfil_codigo,
        },
      },
    )
    .then((perfil) => {
      models.lista_menu
        .destroy({
          where: {
            perfil_codigo: req.params.perfil_codigo,
          },
        })
        .then(() => {
          const lista_menu = req.body.lista_menus;
          const nueva_lista = [];
          lista_menu.forEach(({ menu_codigo, nivel_acceso }) => {
            nueva_lista.push({
              perfil_codigo: req.params.perfil_codigo,
              menu_codigo,
              nivel_acceso,
            });
          });

          models.lista_menu
            .bulkCreate(nueva_lista)
            .then(() => {
              cache.delValue(`perfil-${req.params.perfil_codigo}`);
              res.json(perfil);
            })
            .catch((err) => {
              logger.log('error', {
                ubicacion: filename,
                token,
                message: { mensaje: err.message, tracestack: err.stack },
              });
              res.status(400).send(err);
            });
        });
    })
    .catch((err) => {
      logger.log('error', {
        ubicacion: filename,
        token,
        message: { mensaje: err.message, tracestack: err.stack },
      });
      res.status(400).send(err);
    });
};

exports.desactivar = (req, res) => {
  const logger = req.app.get('winston');
  const token = req.header('Authorization').split(' ')[1];
  models.perfil
    .update(
      {
        estado_registro: req.body.estado_registro,
      },
      {
        where: {
          perfil_codigo: req.params.perfil_codigo,
        },
      },
    )
    .then((filasAfectadas) => {
      try {
        cache.delValue(`perfil-${req.params.perfil_codigo}`);
        res.json({
          mensaje: filasAfectadas,
        });
      } catch (error) {
        logger.log('warn', {
          ubicacion: filename,
          token,
          message: 'Error al eliminar de cache',
        });
        res.status(400).send('Error al eliminar de cache');
      }
    })
    .catch((err) => {
      logger.log('error', {
        ubicacion: filename,
        token,
        message: { mensaje: err.message, tracestack: err.stack },
      });
      res.status(400).json({
        error: err.errors,
      });
    });
};

exports.listar = (req, res) => {
  const logger = req.app.get('winston');
  const token = req.header('Authorization').split(' ')[1];
  models.perfil
    .findAll({
      attributes: [
        'perfil_codigo',
        'perfil_nombre',
        'descripcion',
        'icono',
        'estado_registro',
      ],
      include: [
        {
          model: models.lista_menu,
          required: true,
          attributes: ['menu_codigo', 'nivel_acceso'],
          where: {
            nivel_acceso: {
              [Op.gt]: 0, // Greater than (>)
            },
          },
        },
      ],
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
      res.status(404).json({
        error: err.errors,
      });
    });
};

exports.eliminar = async (req, res) => {
  const logger = req.app.get('winston');
  const token = req.header('Authorization').split(' ')[1];
  try {
    const result = await models.perfil.destroy({
      where: {
        perfil_codigo: req.params.perfil_codigo,
      },
    });
    console.log('Result:', result);
    cache.delValue(`perfil-${req.params.perfil_codigo}`);
    res.json({
      message: result,
    });
  } catch (err) {
    logger.log('error', {
      ubicacion: filename,
      token,
      message: { mensaje: err.message, tracestack: err.stack },
    });
    res.status(500).json({
      error: err.errors,
    });
  }
};
