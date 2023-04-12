const Sequelize = require("sequelize");
const models = require("../models");
const utils = require("../services/utils");
const moment = require("moment");
const Op = Sequelize.Op;
const fs = require("fs");
const key = require("../config/key");
const hash = require("object-hash");
var filename = module.filename.split("/").slice(-1);

exports.buscar = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      //OBTENER DATOS DE CAJA DESDE REDIS
      models.sequelize
        .query(`select * from buscar_operaciones_central(:usuario, :fechaTrabajo);`, {
          replacements: {
            usuario: tokenDecodificado.id,
            fechaTrabajo: moment().format("YYYY-MM-DD")
          },
          type: models.sequelize.QueryTypes.SELECT
        })
        .then(operaciones => {
          res.json(operaciones);
        })
        .catch(err => {
          logger.log("error", {
            ubicacion: filename,
            token: token,
            message: { mensaje: err.message, tracestack: err.stack }
          });
          res.status(409).send("Error al listar");
        });
    });
  });
};
