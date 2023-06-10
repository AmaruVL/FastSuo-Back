const Sequelize = require("sequelize");
var PdfPrinter = require("pdfmake");
const models = require("../models");
const moment = require("moment");
const utils = require("../services/utils");
const { getValue } = require("../config/cache");
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.detalle_produccion_oficina = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    let usuario = getValue(tokenDecodificado.id);

    usuario = JSON.parse(usuario);
    const opcion_datos = req.body.opcion_datos;
    const cod_oficina = req.body.cod_oficina;
    const fecha_inicio = req.body.fecha_inicio;
    const fecha_fin = req.body.fecha_fin;

    models.sequelize
      .query(
        `SET timezone = 'America/Lima';` +
          `select * from detalle_produccion_oficina('${opcion_datos}','${cod_oficina}','${fecha_inicio}','${fecha_fin}');`,
        {
          type: models.sequelize.QueryTypes.SELECT,
        },
      )
      .then(resp => {
        res.json(resp);
      })
      .catch(err => {
        logger.log("error", {
          ubicacion: filename,
          token: token,
          message: { mensaje: err.message, tracestack: err.stack },
        });
        res.status(409).send("Error al generar");
      });
  });
};

exports.detalle_produccion_usuario = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    let usuario = getValue(tokenDecodificado.id);

    usuario = JSON.parse(usuario);
    const opcion_datos = req.body.opcion_datos;
    const cod_usuario = req.body.cod_usuario;
    const fecha_inicio = req.body.fecha_inicio;
    const fecha_fin = req.body.fecha_fin;

    models.sequelize
      .query(
        `select * from detalle_produccion_usuario('${opcion_datos}','${cod_usuario}','${fecha_inicio}','${fecha_fin}');`,
        {
          type: models.sequelize.QueryTypes.SELECT,
        },
      )
      .then(resp => {
        res.json(resp);
      })
      .catch(err => {
        logger.log("error", {
          ubicacion: filename,
          token: token,
          message: { mensaje: err.message, tracestack: err.stack },
        });
        res.status(409).send("Error al generar");
      });
  });
};
