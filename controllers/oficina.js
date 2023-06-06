const Sequelize = require("sequelize");
const models = require("../models");
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);
const utils = require("../services/utils");

exports.buscarNombre = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.oficina
    .findAll({
      where: {
        oficina_nombre: {
          [Op.iLike]: `%${req.params.oficina_nombre}%`
        }
      },
      limit: 20
    })
    .then(respuesta => {
      res.json(respuesta);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(409).send(err);
    });
};

exports.buscar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.oficina
    .findByPk(req.params.oficina_codigo)
    .then(objeto => {
      res.json(objeto);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send();
    });
};

exports.actualizar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.oficina
    .update(
      {
        oficina_nombre: req.body.oficina_nombre,
        oficina_tipo: req.body.oficina_tipo,
        oficina_ubicacion: req.body.oficina_ubicacion,
        oficina_direccion: req.body.oficina_direccion,
        oficina_referencia: req.body.oficina_referencia,
        oficina_correo: req.body.oficina_correo,
        oficina_encargado: req.body.oficina_encargado,
        empresa_codigo: req.body.empresa_codigo,
        modo_conexion: req.body.modo_conexion,
        tipo_arreglo: req.body.tipo_arreglo,
        id_centro_poblado: req.body.id_centro_poblado
      },
      {
        where: {
          oficina_codigo: req.params.oficina_codigo
        }
      }
    )
    .then(filasAfectadas => {
      res.json({
        mensaje: filasAfectadas
      });
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send(err);
    });
};

exports.desactivar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.oficina
    .update(
      {
        estado_registro: req.body.estado_registro
      },
      {
        where: {
          oficina_codigo: req.params.oficina_codigo
        }
      }
    )
    .then(filasAfectadas => {
      res.json({
        mensaje: filasAfectadas
      });
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send();
    });
};

exports.listar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.oficina
    .findAll({
      order: [["oficina_nombre", "ASC"]]
    })
    .then(lista => {
      res.json(lista);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send();
    });
};

exports.listarOficinasActivas = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.oficina
    .findAll({
      attributes: ["oficina_codigo", "oficina_nombre", "modo_conexion", "id_centro_poblado"],
      where: {
        [Op.and]: [
          {
            "$empresa.estado_registro$": true
          },
          {
            "$oficina.estado_registro$": true
          }
        ]
      },
      include: [
        {
          attributes: [],
          model: models.empresa,
          required: false
        }
      ],
      order: [["oficina_nombre", "ASC"]]
    })
    .then(lista => {
      res.json(lista);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send();
    });
};

exports.listarOficinasEmpresa = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  var redis = req.app.get("redis");

  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, async (err, usuario) => {
      usuario = JSON.parse(usuario);
      const oficina = await models.oficina.findOne({
        attributes: ["empresa_codigo"],
        where: { oficina_codigo: usuario.oficina_codigo }
      });
      models.oficina
        .findAll({
          attributes: ["oficina_codigo", "oficina_nombre", "modo_conexion"],
          where: {
            [Op.and]: [
              {
                "$oficina.estado_registro$": true
              },
              {
                "$empresa.estado_registro$": true
              }
            ],
            empresa_codigo
          },
          include: [
            {
              attributes: [],
              model: models.empresa,
              required: false
            }
          ],
          order: [["oficina_nombre", "ASC"]]
        })
        .then(lista => {
          res.json(lista);
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
          res.status(412).send();
        });
    });
  });
};

exports.listarOficinasActivasCajas = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.oficina
    .findAll({
      attributes: ["oficina_codigo", "oficina_nombre", "modo_conexion"],
      where: {
        [Op.and]: [
          {
            "$oficina.estado_registro$": true
          },
          {
            "$cajas.estado_registro$": true
          }
        ],
        modo_conexion: 1
      },
      include: [
        {
          attributes: ["caja_codigo", "caja_nombre", "estado_registro"],
          model: models.caja,
          required: false
        }
      ],
      order: [
        ["modo_conexion", "ASC"],
        ["oficina_nombre", "ASC"]
      ]
    })
    .then(lista => {
      res.json(lista);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send();
    });
};

exports.listarOficinasConCajas = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.oficina
    .findAll({
      attributes: ["oficina_codigo", "oficina_nombre", "modo_conexion"],
      where: {
        [Op.and]: [
          {
            "$oficina.estado_registro$": true
          },
          {
            "$cajas.estado_registro$": true
          }
        ]
      },
      include: [
        {
          attributes: ["caja_codigo", "caja_nombre", "estado_registro"],
          model: models.caja,
          required: false
        }
      ],
      order: [
        ["modo_conexion", "ASC"],
        ["oficina_nombre", "ASC"]
      ]
    })
    .then(lista => {
      res.json(lista);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send();
    });
};

exports.listarPor = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.oficina
    .findAll({
      where: {
        empresa_codigo: req.params.empresa_codigo || req.query.empresa_codigo
      }
    })
    .then(lista => {
      res.json(lista);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send();
    });
};

exports.eliminar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.oficina
    .destroy({
      where: {
        oficina_codigo: req.params.oficina_codigo
      }
    })
    .then(respuesta => {
      res.json({
        mensaje: respuesta
      });
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(409).send();
    });
};
