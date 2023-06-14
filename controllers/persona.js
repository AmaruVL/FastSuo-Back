const Sequelize = require('sequelize');
const models = require('../models');

const { Op } = Sequelize;
const filename = module.filename.split('/').slice(-1);

exports.crear = (req, res) => {
  const logger = req.app.get('winston');
  const token = req.header('Authorization').split(' ')[1];
  models.persona
    .create({
      id_persona: req.body.id_cliente,
      tipo_persona: req.body.cliente_tipo_persona,
      nombres: req.body.nombres,
      ap_paterno: req.body.ap_paterno,
      ap_materno: req.body.ap_materno,
      razon_social: req.body.razon_social,
      sexo: req.body.sexo,
      fecha_nacimiento: req.body.fecha_nacimiento,
      nro_fijo: req.body.nro_fijo,
      nro_movil: req.body.nro_movil,
      correo: req.body.correo,
      direccion: req.body.direccion,
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
  models.persona
    .findByPk(req.params.id_administrado, {
      attributes: [
        'id_persona',
        'nombres',
        'ap_paterno',
        'ap_materno',
        'razon_social',
        'fecha_nacimiento',
        'sexo',
      ],
    })
    .then((objeto) => {
      if (!objeto) {
        res.status(404).json({ msg: 'Administrado no encontrado' });
      }
      res.json(objeto);
    })
    .catch((err) => {
      logger.log('error', {
        ubicacion: filename,
        token,
        message: { mensaje: err.message, tracestack: err.stack },
      });
      res.json({
        error: err.errors,
      });
    });
};

exports.buscarNombre = (req, res) => {
  const logger = req.app.get('winston');
  const token = req.header('Authorization').split(' ')[1];
  models.persona
    .findAll({
      where: {
        [Op.or]: [
          {
            razon_social: {
              [Op.iLike]: `%${req.params.nombre}%`,
            },
          },
          {
            id_persona: req.params.nombre,
          },
        ],
      },
      limit: 20,
      attributes: [
        'id_persona',
        'nombres',
        'ap_paterno',
        'ap_materno',
        'razon_social',
        'cliente_tipo_persona',
        'sexo',
        'fecha_nacimiento',
        'nro_fijo',
        'nro_movil',
        'correo',
        'direccion',
        'createdAt',
        [
          Sequelize.fn(
            'CONCAT',
            Sequelize.col('nombres'),
            ' ',
            Sequelize.col('ap_paterno'),
            ' ',
            Sequelize.col('ap_materno'),
          ),
          'full_name',
        ],
      ],
      order: [['razon_social', 'ASC']],
    })
    .then((respuesta) => {
      res.json(respuesta);
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

exports.actualizar = (req, res) => {
  const logger = req.app.get('winston');
  const token = req.header('Authorization').split(' ')[1];
  let fecha_nacimiento = {};
  fecha_nacimiento = req.body.fecha_nacimiento
    ? {
        fecha_nacimiento: req.body.fecha_nacimiento.split('T')[0],
      }
    : {};
  models.persona
    .update(
      {
        tipo_persona: req.body.cliente_tipo_persona,
        nombres: req.body.nombres,
        ap_paterno: req.body.ap_paterno,
        ap_materno: req.body.ap_materno,
        razon_social: req.body.razon_social,
        sexo: req.body.sexo,
        ...fecha_nacimiento,
        nro_fijo: req.body.nro_fijo,
        nro_movil: req.body.nro_movil,
        correo: req.body.correo,
        direccion: req.body.direccion,
      },
      {
        where: {
          id_persona: req.params.id_administrado,
        },
      },
    )
    .then((filasAfectadas) => {
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
      res.json({
        error: err.errors,
      });
    });
};

// TODO: Agregar paginación a endpoint listar
exports.listar = (req, res) => {
  const logger = req.app.get('winston');
  const token = req.header('Authorization').split(' ')[1];
  models.persona
    .findAll({
      limit: 20,
      attributes: [
        'id_persona',
        'nombres',
        'ap_paterno',
        'ap_materno',
        'razon_social',
        'cliente_tipo_persona',
        'sexo',
        'fecha_nacimiento',
        'nro_fijo',
        'nro_movil',
        'correo',
        'direccion',
        'createdAt',
        [
          Sequelize.fn(
            'CONCAT',
            Sequelize.col('nombres'),
            ' ',
            Sequelize.col('ap_paterno'),
            ' ',
            Sequelize.col('ap_materno'),
          ),
          'full_name',
        ],
      ],
      order: [['razon_social', 'ASC']],
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
  models.persona
    .destroy({
      where: {
        id_persona: req.params.id_administrado,
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
