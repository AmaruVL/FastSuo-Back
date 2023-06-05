const Sequelize = require("sequelize");
const models = require("../models");
// import utils from "../services/utils";
// import oficina from "../controllers/oficina";
const moment = require("moment");
const Op = Sequelize.Op;
const fs = require("fs");
const { default: PQueue } = require("p-queue");
var filename = module.filename.split("/").slice(-1);

exports.migrar = async function(req, res, next) {
  const queue = new PQueue({ concurrency: 1 });
  const inTransaction = fn => queue.add(() => models.sequelize.transaction(transaction => fn(transaction)));

  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  //const token = req.header("Authorization").split(" ")[1];

  let rawdata = fs.readFileSync("listaGirosProcesados.json");
  let jsonGiros = JSON.parse(rawdata);
  let conteoC = 0;
  let conteoI = 0;
  var ArrErroneos = [];
  console.log("TOTAL", jsonGiros.length);

  for (var i = 0; i < jsonGiros.length; i++) {
    var giro = jsonGiros[i];
    await inTransaction(t => {
      return models.operacion_caja
        .findAll(
          {
            limit: 1,
            where: {
              documento_codigo: giro.documento_codigo,
              documento_serie: giro.documento_serie
            },
            order: [["nro_operacion", "DESC"]]
          },
          { transaction: t }
        )
        .then(async opsCaja => {
          let nro_operacion;

          if (opsCaja.length === 0) {
            const docSerie = await models.documento_serie.findOne({
              where: {
                documento_codigo: giro.documento_codigo,
                documento_serie: giro.documento_serie
              }
            });
            nro_operacion = parseInt(docSerie.nro_inicio) - 1;
          } else {
            nro_operacion = opsCaja[0].nro_operacion;
          }
          var date = new Date();
          var fechaString;
          fechaString = date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2);
          return models.operacion_caja
            .count(
              {
                where: {
                  fecha_hora_operacion: { [Op.gte]: fechaString }
                }
              },
              {
                transaction: t
              }
            )
            .then(async nro_operacion_dia => {
              const cliente = await models.cliente_proveedor.findByPk(giro.beneficiario_docident);
              let id_cliente = {};
              if (cliente !== null) {
                id_cliente = {
                  id_cliente: giro.beneficiario_docident
                };
              }
            });
        });
    })
      .then(() => {
        conteoC++;
      })
      .catch(err => {
        console.log(err);
        conteoI++;
        ArrErroneos.push(giro);
      });
  }
  console.log(ArrErroneos);
  console.log("CORRECTOS", conteoC);
  console.log("INCORRECTOS", conteoI);
  res.status(200).send("hecho");
};

exports.migrarOperaciones = async function(req, res, next) {
  const queue = new PQueue({ concurrency: 1 });
  const inTransaction = fn => queue.add(() => models.sequelize.transaction(transaction => fn(transaction)));

  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  //const token = req.header("Authorization").split(" ")[1];

  let rawdata = fs.readFileSync("listaOtros.json");
  let jsonGiros = JSON.parse(rawdata);
  let conteoC = 0;
  let conteoI = 0;
  var ArrErroneos = [];
  console.log("TOTAL", jsonGiros.length);

  for (var i = 0; i < jsonGiros.length; i++) {
    var giro = jsonGiros[i];
    await inTransaction(t => {
      return models.operacion_caja
        .create(
          {
            documento_codigo: giro.doc_codigo,
            documento_serie: giro.serie,
            nro_operacion: giro.nro_operacion,
            nro_transaccion: giro.nro_operacion,
            nro_transaccion_dia: giro.nro_operacion,
            fecha_hora_operacion: giro.fecha_hora,
            oficina_origen_codigo: giro.oficina_origen,
            fecha_trabajo: giro.fecha_trabajo,
            caja_codigo: giro.caja_codigo,
            concepto: giro.concepto,
            moneda1_Ingre: giro.moneda1_ingreso,
            moneda1_Egre: giro.moneda1_egreso,
            modulo: giro.modulo
          },
          {
            transaction: t
          }
        )
        .then(op_Caja => {
          return models.habilitacion.create(
            {
              origen_docu_codigo: giro.a_doc_codigo,
              origen_docu_serie: giro.a_serie,
              origen_nro_operacion: giro.a_nro_operacion,
              tipo_habilitacion: giro.a_tipo_habilitacion,
              importe: giro.a_importe,
              moneda: giro.a_moneda,
              destino_documento_codigo: giro.b_doc_codigo,
              destino_documento_serie: giro.b_serie,
              destino_nro_operacion: giro.b_nro_operacion,
              destino_oficina_codigo: giro.a_destino_codigo,
              origen_oficina_codigo: giro.a_origen_codigo,
              habilitacion_estado: giro.a_habilitacion_estado
            },
            {
              transaction: t
            }
          );
        });
    })
      .then(() => {
        conteoC++;
      })
      .catch(err => {
        console.log(err);
        conteoI++;
        ArrErroneos.push(giro);
      });
  }
  console.log(ArrErroneos);
  console.log("CORRECTOS", conteoC);
  console.log("INCORRECTOS", conteoI);
  res.status(200).send("hecho");
};
