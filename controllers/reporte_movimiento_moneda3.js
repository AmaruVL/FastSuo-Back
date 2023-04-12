const Sequelize = require("sequelize");
var PdfPrinter = require("pdfmake");

const models = require("../models");
const moment = require("moment");
import utils from "../services/utils";
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.saldos_caja = (req, res) => {
    var logger = req.app.get("winston");
    var redis = req.app.get("redis");
    const token = req.header("Authorization").split(" ")[1];
    utils.decodeToken(token, tokenDecodificado => {
      //OBTENER DATOS DEL USUARIO DESDE REDIS
      redis.get(tokenDecodificado.id, async (err, usuario) => {
        usuario = JSON.parse(usuario);
        const caja_codigo = req.params.caja_codigo;
        const fecha_inicio = req.params.fecha_inicio;
        const fecha_final = req.params.fecha_final;
  
        models.sequelize
          .query(
            `select * from saldos_caja_moneda3('${fecha_inicio}', '${fecha_final}', '${caja_codigo}');`,
            {
              type: models.sequelize.QueryTypes.SELECT,
            }
          )
          .then(resp => {
              res.json(resp);      
          })
          .catch(err => {
              logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
              res.status(409).send("Error al generar");
              console.log(err)
          });
      });
    });
};

exports.movimientos_caja = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, async (err, usuario) => {
      usuario = JSON.parse(usuario);
      const caja_codigo = req.params.caja_codigo;
      const razon_social = req.params.razon_social;
      const fecha_inicio = req.params.fecha_inicio;
      const fecha_final = req.params.fecha_final;

      models.sequelize
        .query(
          `select * from resumen_caja_moneda3('${caja_codigo}', '${razon_social}', '${fecha_inicio}', '${fecha_final}');`,
          {
            type: models.sequelize.QueryTypes.SELECT,
          }
        )
        .then(resp => {
            res.json(resp);      
        })
        .catch(err => {
            logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
            res.status(409).send("Error al generar");
            console.log(err)
        });
    });
  });
};

exports.saldos_oficina = (req, res) => {
    var logger = req.app.get("winston");
    var redis = req.app.get("redis");
    const token = req.header("Authorization").split(" ")[1];
    utils.decodeToken(token, tokenDecodificado => {
      //OBTENER DATOS DEL USUARIO DESDE REDIS
      redis.get(tokenDecodificado.id, async (err, usuario) => {
        usuario = JSON.parse(usuario);
        const oficina_codigo = req.params.oficina_codigo;
        const fecha_inicio = req.params.fecha_inicio;
        const fecha_final = req.params.fecha_final;
  
        models.sequelize
          .query(
            `select * from saldos_oficina_moneda3('${fecha_inicio}', '${fecha_final}', '${oficina_codigo}');`,
            {
              type: models.sequelize.QueryTypes.SELECT,
            }
          )
          .then(resp => {
              res.json(resp);      
          })
          .catch(err => {
              logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
              res.status(409).send("Error al generar");
              console.log(err)
          });
      });
    });
};

exports.movimientos_oficina = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, async (err, usuario) => {
      usuario = JSON.parse(usuario);
      const oficina_codigo = req.params.oficina_codigo;
      const razon_social = req.params.razon_social;
      const fecha_inicio = req.params.fecha_inicio;
      const fecha_final = req.params.fecha_final;

      models.sequelize
        .query(
          `select * from resumen_oficina_moneda3('${oficina_codigo}', '${razon_social}', '${fecha_inicio}', '${fecha_final}');`,
          {
            type: models.sequelize.QueryTypes.SELECT,
          }
        )
        .then(resp => {
            res.json(resp);      
        })
        .catch(err => {
            logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
            res.status(409).send("Error al generar");
            console.log(err)
        });
    });
  });
};