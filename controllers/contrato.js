const Sequelize = require("sequelize");
const models = require("../models");
var filename = module.filename.split("/").slice(-1);

exports.crear = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.contrato
    .create({
      nro_contrato: req.body.nro_contrato,
      oficina_codigo: req.body.oficina_codigo,
      contrato_fecha_inicio: req.body.contrato_fecha_inicio,
      contrato_fecha_fin: req.body.contrato_fecha_fin,
      credito_maximo: req.body.credito_maximo,
      dt_directo: req.body.dt_directo,
      dt_afiliado: req.body.dt_afiliado,
      dt_tercero: req.body.dt_tercero,
      contrato_estado: req.body.contrato_estado,
      monto_alerta: req.body.monto_alerta
    })
    .then(async objeto => {
      const contrato = await models.contrato.findOne({
        where: {
          oficina_codigo: req.body.oficina_codigo
        },
        include: [
          {
            model: models.oficina
          }
        ]
      });
      if (contrato) {
        redis.set("contrato-" + req.body.oficina_codigo, JSON.stringify(contrato));
      }
      res.json(objeto);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(409).send("No se puede guardar");
    });
};

exports.buscar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.contrato
    .findOne({
      where: {
        oficina_codigo: req.params.oficina_codigo
      }
    })
    .then(objeto => {
      if (objeto == null) {
        logger.log("warn", { ubicacion: filename, token: token, message: "Oficina no cuenta con un contrato" });
        res.status(412).send("Oficina no cuenta con un contrato");
      } else {
        res.json(objeto);
      }
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send("sin datos");
    });
};

exports.actualizar = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  models.contrato
    .update(
      {
        contrato_fecha_inicio: req.body.contrato_fecha_inicio,
        contrato_fecha_fin: req.body.contrato_fecha_fin,
        credito_maximo: req.body.credito_maximo,
        dt_directo: req.body.dt_directo,
        dt_afiliado: req.body.dt_afiliado,
        dt_tercero: req.body.dt_tercero,
        monto_alerta: req.body.monto_alerta,
        contrato_estado: req.body.contrato_estado
      },
      {
        where: {
          nro_contrato: req.params.nro_contrato,
          oficina_codigo: req.params.oficina_codigo
        }
      }
    )
    .then(async filasAfectadas => {
      if (filasAfectadas == 1) {
        const contrato = await models.contrato.findOne({
          where: {
            oficina_codigo: req.params.oficina_codigo
          },
          include: [
            {
              model: models.oficina
            }
          ]
        });
        if (contrato) {
          redis.set("contrato-" + req.params.oficina_codigo, JSON.stringify(contrato));
        }
      }
      res.json({
        mensaje: filasAfectadas
      });
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.json({
        error: err.errors
      });
    });
};

exports.desactivar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.contrato
    .update(
      {
        contrato_estado: req.body.contrato_estado
      },
      {
        where: {
          nro_contrato: req.params.nro_contrato,
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
      res.json({
        error: err.errors
      });
    });
};

exports.listar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.contrato
    .findAll({})
    .then(lista => {
      res.json(lista);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.json({
        error: err.errors
      });
    });
};

exports.listarPor = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.contrato
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
      res.json({
        error: err.errors
      });
    });
};

exports.eliminar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.contrato
    .destroy({
      where: {
        nro_contrato: req.params.nro_contrato,
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
      res.json({
        error: err.errors
      });
    });
};
