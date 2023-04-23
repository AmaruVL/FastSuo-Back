const Sequelize = require("sequelize");
var PdfPrinter = require("pdfmake");

const models = require("../models");
const moment = require("moment");
const utils = require("../services/utils")
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.operaciones = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, async (err, usuario) => {
      usuario = JSON.parse(usuario);
      const id_cuenta = req.query.id_cuenta;
      const caja_codigo = req.query.caja_codigo ? req.query.caja_codigo : "*";
      const fecha_inicio = req.query.fecha_inicio;
      const fecha_fin = req.query.fecha_fin;

      models.sequelize
        .query(
          `select *  from buscar_operaciones_servicios(id_cuenta:= :id_cuenta, caja_origen:= :caja_codigo, fecha_inicio:= :fecha_inicio, fecha_fin:= :fecha_fin);`,
          {
            replacements: {
              id_cuenta: id_cuenta,
              caja_codigo: caja_codigo,
              fecha_inicio: fecha_inicio,
              fecha_fin: fecha_fin
            },
            type: models.sequelize.QueryTypes.SELECT,
            nest: true
          }
        )
        .then(resp => {
          models.sequelize
            .query(`select * from saldos_cuenta_servicios(:id_cuenta);`, {
              replacements: {
                id_cuenta: id_cuenta
              },
              type: models.sequelize.QueryTypes.SELECT,
              nest: true
            })
            .then(saldos => {
              let ingresos = 0;
              let egresos = 0;
              saldos.forEach(element => {
                if (element.recibo_tipo === "INGRESO") {
                  ingresos = parseFloat(element.total);
                } else if (element.recibo_tipo === "EGRESO") {
                  egresos = parseFloat(element.total);
                }
              });
              res.json({ operaciones: resp, saldos: { ingresos, egresos } });
            });
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
          res.status(409).send(err);
        });
    });
  });
};

exports.operacionesOficina = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, async (err, usuario) => {
      usuario = JSON.parse(usuario);
      const id_cuenta = req.query.id_cuenta;
      const caja_codigo = "*";
      const fecha_inicio = req.query.fecha_inicio;
      const fecha_fin = req.query.fecha_fin;

      const caja = await models.caja.findOne({
        where: {
          caja_codigo: usuario.caja_codigo
        }
      });

      models.sequelize
        .query(
          `select *  from buscar_operaciones_servicios(id_cuenta:= :id_cuenta, caja_origen:= :caja_codigo, fecha_inicio:= :fecha_inicio, fecha_fin:= :fecha_fin, oficina_cod:= :oficina_codigo);`,
          {
            replacements: {
              id_cuenta: id_cuenta,
              caja_codigo: caja_codigo,
              fecha_inicio: fecha_inicio,
              fecha_fin: fecha_fin,
              oficina_codigo: caja.oficina_codigo
            },
            type: models.sequelize.QueryTypes.SELECT,
            nest: true
          }
        )
        .then(resp => {
          models.sequelize
            .query(`select * from saldos_cuenta_servicios(:id_cuenta,:oficina_codigo);`, {
              replacements: {
                id_cuenta: id_cuenta,
                oficina_codigo: caja.oficina_codigo
              },
              type: models.sequelize.QueryTypes.SELECT,
              nest: true
            })
            .then(saldos => {
              let ingresos = 0;
              let egresos = 0;
              saldos.forEach(element => {
                if (element.recibo_tipo === "INGRESO") {
                  ingresos = parseFloat(element.total);
                } else if (element.recibo_tipo === "EGRESO") {
                  egresos = parseFloat(element.total);
                }
              });
              res.json({ operaciones: resp, saldos: { ingresos, egresos } });
            });
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
          res.status(409).send(err);
        });
    });
  });
};
