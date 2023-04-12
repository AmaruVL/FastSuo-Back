const Sequelize = require("sequelize");
const models = require("../models");
var filename = module.filename.split("/").slice(-1);

exports.crear = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.centro_costo
    .create({
      centro_costo_id: req.body.centro_costo_id,
      centro_costo_nombre: req.body.centro_costo_nombre,
      oficina_codigo: req.body.oficina_codigo,
      centro_costo_obs: req.body.centro_costo_obs,
      estado_registro: req.body.estado_registro
    })
    .then(objeto => {
      res.json(objeto);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send(err);
    });
};

exports.buscar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.centro_costo
    .findByPk(req.params.centro_costo_id)
    .then(objeto => {
      res.json(objeto);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send(err);
    });
};

exports.actualizar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.centro_costo
    .update(
      {
        centro_costo_nombre: req.body.centro_costo_nombre,
        oficina_codigo: req.body.oficina_codigo,
        centro_costo_obs: req.body.centro_costo_obs
      },
      {
        where: {
          centro_costo_id: req.params.centro_costo_id
        }
      }
    )
    .then(filasAfectadas => {
      res.json(filasAfectadas);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send(err);
    });
};

exports.desactivar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.centro_costo
    .update(
      {
        estado_registro: req.body.estado_registro
      },
      {
        where: {
          centro_costo_id: req.params.centro_costo_id
        }
      }
    )
    .then(filasAfectadas => {
      res.json(filasAfectadas);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send(err);
    });
};

exports.listar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.centro_costo
    .findAll({})
    .then(lista => {
      res.json(lista);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send(err);
    });
};

exports.listarActivas = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.centro_costo
    .findAll({
      where: {
        estado_registro: true
      }
    })
    .then(lista => {
      res.json(lista);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send(err);
    });
};

exports.listarPor = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.centro_costo
    .findAll({
      where: {
        oficina_codigo: req.params.oficina_codigo || req.query.oficina_codigo
      }
    })
    .then(lista => {
      res.json(lista);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send(err);
    });
};

exports.eliminar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.centro_costo
    .destroy({
      where: {
        centro_costo_id: req.params.centro_costo_id
      }
    })
    .then(respuesta => {
      res.json(respuesta);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(409).send(err);
    });
};
