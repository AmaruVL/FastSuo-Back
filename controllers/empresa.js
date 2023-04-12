const Sequelize = require("sequelize");
const models = require("../models");
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);
exports.crear = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.empresa
    .create({
      empresa_codigo: req.body.empresa_codigo,
      razon_social: req.body.razon_social,
      ruc: req.body.ruc,
      contacto_nombre: req.body.contacto_nombre,
      contacto_nro: req.body.contacto_nro,
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

exports.buscarNombre = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.empresa
    .findAll({
      where: {
        razon_social: {
          [Op.iLike]: `%${req.params.empresa_nombre}%`
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
  models.empresa
    .findByPk(req.params.empresa_codigo)
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
  models.empresa
    .update(
      {
        razon_social: req.body.razon_social,
        ruc: req.body.ruc,
        contacto_nombre: req.body.contacto_nombre,
        contacto_nro: req.body.contacto_nro
      },
      {
        where: {
          empresa_codigo: req.params.empresa_codigo
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

exports.desactivar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.empresa
    .update(
      {
        estado_registro: req.body.estado_registro
      },
      {
        where: {
          empresa_codigo: req.params.empresa_codigo
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
  models.empresa
    .findAll({})
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
  models.empresa
    .destroy({
      where: {
        empresa_codigo: req.params.empresa_codigo
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
