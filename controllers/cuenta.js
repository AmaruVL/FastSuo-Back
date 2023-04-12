const Sequelize = require("sequelize");
const models = require("../models");
var filename = module.filename.split("/").slice(-1);

exports.crear = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.cuenta
    .create({
      cuenta_codigo: req.body.cuenta_codigo,
      cuenta_denominacion: req.body.cuenta_denominacion,
      cuenta_tipo: req.body.cuenta_tipo,
      codigo_sunat: req.body.codigo_sunat,
      cuenta_obs: req.body.cuenta_obs,
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
  models.cuenta
    .findByPk(req.params.cuenta_codigo)
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
  models.cuenta
    .update(
      {
        cuenta_denominacion: req.body.cuenta_denominacion,
        cuenta_tipo: req.body.cuenta_tipo,
        codigo_sunat: req.body.codigo_sunat,
        cuenta_obs: req.body.cuenta_obs
      },
      {
        where: {
          cuenta_codigo: req.params.cuenta_codigo
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
  models.cuenta
    .update(
      {
        estado_registro: req.body.estado_registro
      },
      {
        where: {
          cuenta_codigo: req.params.cuenta_codigo
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

exports.listar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.cuenta
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
  models.cuenta
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

exports.eliminar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.cuenta
    .destroy({
      where: {
        cuenta_codigo: req.params.cuenta_codigo
      }
    })
    .then(respuesta => {
      res.json({
        mensaje: respuesta
      });
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(409).send(err);
    });
};
