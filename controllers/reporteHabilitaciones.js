const Sequelize = require("sequelize");
var PdfPrinter = require("pdfmake");
const models = require("../models");
const moment = require("moment");
const utils = require("../services/utils");
const { getValue } = require("../config/cache");
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.habilitaciones = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];

  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    let usuario = getValue(tokenDecodificado.id);

    usuario = JSON.parse(usuario);
    var oficina_origen = req.body.oficina_origen;
    var oficina_destino = req.body.oficina_destino;
    var tipo_habilitacion = req.body.tipo;
    var fecha_inicio = req.body.fecha_inicio;
    var fecha_final = req.body.fecha_final;

    models.sequelize
      .query(
        `select * from reporHabilitaciones1('${oficina_origen}','${oficina_destino}','${tipo_habilitacion}','${fecha_inicio}','${fecha_final}');`,
        {
          type: models.sequelize.QueryTypes.SELECT,
        },
      )
      .then(lista => {
        res.json(lista);
      })
      .catch(err => {
        logger.log("error", { ubicacion: filename, token: token, err });
        res.json({
          error: err.errors,
        });
        console.log(err);
      });
  });
};
