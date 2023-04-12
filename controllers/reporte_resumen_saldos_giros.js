const Sequelize = require("sequelize");
var PdfPrinter = require("pdfmake");
const models = require("../models");
const moment = require("moment");
import utils from "../services/utils";
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.resumen_saldos_giros = (req, res) => {
    var logger = req.app.get("winston");
    var redis = req.app.get("redis");
    const token = req.header("Authorization").split(" ")[1];
    utils.decodeToken(token, tokenDecodificado => {
      //OBTENER DATOS DEL USUARIO DESDE REDIS
      redis.get(tokenDecodificado.id, async (err, usuario) => {
        usuario = JSON.parse(usuario);
        const oficina_codigo = req.body.oficina_codigo;
        const opcion_datos = req.body.opcion_datos;
        const fechai = req.body.fecha_inicio;
        const fechaf = req.body.fecha_final;
        models.sequelize
          .query(`select * from saldos_giros_oficinas('${oficina_codigo}','${opcion_datos}','${fechai}','${fechaf}')`, {
            type: models.sequelize.QueryTypes.SELECT
          })
          .then(totales => {
            res.json(totales);
          })
          .catch(err => {
            logger.log("error", { ubicacion: filename, token: token, message: err.message });
            res.status(409).send("Error");
            console.log(err);
          });
      });
    });
  };