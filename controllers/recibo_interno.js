const Sequelize = require("sequelize");
const models = require("../models");
const utils = require("../services/utils")
const moment = require("moment");
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.crear = function(req, res, next) {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      //OBTENER DATOS DE CAJA DESDE REDIS
      redis.get(tokenDecodificado.idc, (err, caja) => {
        return models.sequelize
          .transaction(
            {
              isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
            },
            async t => {
              caja = JSON.parse(caja);
              const hoy = new Date();
              const yyyy = hoy.getFullYear();
              const mm = ("0" + (hoy.getMonth() + 1)).slice(-2);
              const dd = ("0" + hoy.getDate()).slice(-2);
              const fechaHoy = `${yyyy}-${mm}-${dd}`;
              await getSaldoCaja(fechaHoy, tokenDecodificado.idc).then(saldos => {
                if (req.body.recibo_tipo === "EGRESO") {
                  if (req.body.moneda === "SOLES" && caja.verificar_saldo_caja == "VERIFICAR") {
                    if (saldos.saldo1 < req.body.importe) {
                      throw new Error("Su caja no cuenta con saldo suficiente");
                    }
                  } else if (req.body.moneda === "DOLARES" && caja.verificar_saldo_caja == "VERIFICAR") {
                    if (saldos.saldo1 < req.body.importe) {
                      throw new Error("Su caja no cuenta con saldo suficiente");
                    }
                  } else if (req.body.moneda != "DOLARES" && req.body.moneda != "SOLES") {
                    throw new Error("Moneda no reconocida");
                  }
                }
              });
              //INICIA TRANSACCION
              return models.operacion_caja
                .findAll(
                  {
                    limit: 1,
                    where: {
                      documento_codigo: req.body.documento_codigo,
                      documento_serie: req.body.documento_serie
                    },
                    order: [["nro_operacion", "DESC"]]
                  },
                  {
                    transaction: t
                  }
                )
                .then(async opsCaja => {
                  let nro_operacion;
                  /**
                   * SI ES LA PRIMERA OPERACION DE LA CAJA
                   * CONSULTAR EL NUMERO DE INICIO DEL DOCUMENTO
                   */
                  if (opsCaja.length === 0) {
                    const docSerie = await models.documento_serie.findOne({
                      where: {
                        documento_codigo: req.body.documento_codigo,
                        documento_serie: req.body.documento_serie
                      }
                    });
                    nro_operacion = parseInt(docSerie.nro_inicio) - 1;
                  } else {
                    nro_operacion = opsCaja[0].nro_operacion;
                  }
                  return models.operacion_caja
                    .count(
                      {
                        where: {
                          fecha_trabajo: Date.now()
                        }
                      },
                      {
                        transaction: t
                      }
                    )
                    .then(nro_operacion_dia => {
                      return models.operacion_caja
                        .create(
                          {
                            documento_codigo: req.body.documento_codigo, //BODY
                            documento_serie: req.body.documento_serie, //BODY
                            nro_operacion: nro_operacion + 1,
                            nro_transaccion: nro_operacion + 1,
                            nro_transaccion_dia: nro_operacion_dia + 1,
                            fecha_hora_operacion: Date.now(),
                            id_cliente: req.body.beneficiario_docident, //BODY
                            cliente_razon_social: "RECIBO " + req.body.recibo_tipo + " " + req.body.razon_social, //BODY
                            oficina_origen_codigo: usuario.oficina_codigo,
                            caja_codigo: tokenDecodificado.idc,
                            fecha_trabajo: caja.fecha_trabajo,
                            cuenta_codigo: req.body.cuenta_codigo, ///?????										//BODY
                            codigo_validador: req.body.codigo_validador, //??									//BODY
                            concepto: req.body.concepto, ////??																//BODY
                            tipo_cambio: 0, //BODY
                            moneda1_Ingre:
                              req.body.moneda === "SOLES"
                                ? req.body.recibo_tipo === "INGRESO" || req.body.recibo_tipo === "Reciboingreso"
                                  ? req.body.importe
                                  : 0
                                : 0, //???suma de valores?????? //BODY
                            moneda1_Egre:
                              req.body.moneda === "SOLES"
                                ? req.body.recibo_tipo === "EGRESO" || req.body.recibo_tipo === "Reciboegreso"
                                  ? req.body.importe
                                  : 0
                                : 0, //?suma de valores??????			//BODY
                            moneda2_Ingre:
                              req.body.moneda === "DOLARES"
                                ? req.body.recibo_tipo === "INGRESO" || req.body.recibo_tipo === "Reciboingreso"
                                  ? req.body.importe
                                  : 0
                                : 0,
                            moneda2_Egre:
                              req.body.moneda === "DOLARES"
                                ? req.body.recibo_tipo === "EGRESO" || req.body.recibo_tipo === "Reciboegreso"
                                  ? req.body.importe
                                  : 0
                                : 0,
                            moneda3_Ingre: 0,
                            moneda3_Egre: 0,
                            modulo: "Recibo interno",
                            estado_registro: 2,
                            usuario: tokenDecodificado.id
                          },
                          {
                            transaction: t
                          }
                        )
                        .then(op_Caja => {
                          return models.recibo_interno.create(
                            {
                              recibo_doc_codigo: op_Caja.documento_codigo,
                              recibo_doc_serie: op_Caja.documento_serie,
                              recibo_nro: op_Caja.nro_operacion,
                              recibo_tipo: req.body.recibo_tipo,
                              recibo_finalidad: req.body.recibo_finalidad,
                              cuenta_codigo: req.body.cuenta_codigo,
                              id_cliente: req.body.id_cliente,
                              razon_social: req.body.razon_social,
                              recibo_concepto: req.body.recibo_concepto,
                              moneda: req.body.moneda,
                              importe: req.body.importe,
                              recibo_obs: req.body.recibo_obs,
                              centro_costo_id: req.body.centro_costo_id,
                              recibo_fecha_hora: Date.now(),
                              estado_registro: 2
                            },
                            {
                              transaction: t
                            }
                          );
                        });
                    });
                });
            }
          )
          .then(result => {
            res.json(result);
            // Transaction has been committed
            // result is whatever the result of the promise chain returned to the transaction callback
          })
          .catch(err => {
            logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
            res.status(412).send(err.message);
            // Transaction has been rolled back
            // err is whatever rejected the promise chain returned to the transaction callback
          });
      });
    });
  });
};

exports.extornar = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      //OBTENER DATOS DE CAJA DESDE REDIS
      redis.get(tokenDecodificado.idc, (err, caja) => {
        caja = JSON.parse(caja);
        return models.sequelize
          .transaction(
            {
              isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
            },
            t => {
              return models.sequelize
                .query(
                  `select 
                    recibo_interno.recibo_tipo,
                    operacion_caja.oficina_origen_codigo,
                    operacion_caja.caja_codigo,
                    operacion_caja.fecha_trabajo,
                    recibo_interno.cuenta_codigo,
                    recibo_interno.razon_social,
                    recibo_interno.recibo_concepto,
                    recibo_interno.recibo_finalidad,
                    recibo_interno.moneda,
                    recibo_interno.importe,
                    recibo_interno.centro_costo_id,
                    recibo_interno.id_cliente,
                    recibo_interno.estado_registro
                  from operacion_caja
                  inner join recibo_interno 
                    on recibo_interno.recibo_doc_codigo = operacion_caja.documento_codigo 
                    and recibo_interno.recibo_doc_serie = operacion_caja.documento_serie 
                    and recibo_interno.recibo_nro = operacion_caja.nro_operacion
                  where documento_codigo = :recibo_codigo AND documento_serie = :recibo_serie and nro_operacion = :recibo_operacion`,
                  {
                    replacements: {
                      recibo_codigo: req.body.documento_codigo,
                      recibo_serie: req.body.documento_serie,
                      recibo_operacion: req.body.nro_operacion
                    },
                    type: models.sequelize.QueryTypes.SELECT,
                    transaction: t
                  }
                )
                .then(async recibo => {
                  if (recibo.length > 0) {
                    recibo = recibo[0];
                  } else {
                    throw new Error("No existe el recibo buscado");
                  }
                  let modulo = "";

                  if (recibo.recibo_tipo === "INGRESO") {
                    modulo = { modulo: "Reciboegreso" };
                  } else if (recibo.recibo_tipo === "EGRESO") {
                    modulo = { modulo: "Reciboingreso" };
                  }

                  const documento = await models.documento_serie.findOne({
                    where: {
                      oficina_codigo: recibo.oficina_origen_codigo,
                      ...modulo
                    }
                  });

                  if (documento == null) {
                    throw new Error("Oficina no cuenta con documento de " + modulo.modulo);
                  }

                  return models.recibo_interno
                    .findOne({
                      where: {
                        recibo_doc_codigo: req.body.documento_codigo,
                        recibo_doc_serie: req.body.documento_serie,
                        recibo_nro: req.body.nro_operacion
                      },
                      lock: t.LOCK.UPDATE,
                      transaction: t
                    })
                    .then(recbo => {
                      if (recbo.estado_registro == 3) {
                        throw new Error("Recibo se encuentra extornado");
                      } else if (recbo.estado_registro != 2) {
                        throw new Error("Estado de recibo indeterminado");
                      }
                      return models.operacion_caja
                        .findAll(
                          {
                            limit: 1,
                            where: {
                              documento_codigo: documento.documento_codigo,
                              documento_serie: documento.documento_serie
                            },
                            order: [["nro_operacion", "DESC"]]
                          },
                          {
                            transaction: t
                          }
                        )
                        .then(async opsCaja => {
                          let nro_operacion;
                          /**
                           * SI ES LA PRIMERA OPERACION DE LA CAJA
                           * CONSULTAR EL NUMERO DE INICIO DEL DOCUMENTO
                           */
                          if (opsCaja.length === 0) {
                            const docSerie = await models.documento_serie.findOne({
                              where: {
                                documento_codigo: documento.documento_codigo,
                                documento_serie: documento.documento_serie
                              }
                            });
                            nro_operacion = parseInt(docSerie.nro_inicio) - 1;
                          } else {
                            nro_operacion = opsCaja[0].nro_operacion;
                          }
                          return models.operacion_caja
                            .count(
                              {
                                where: {
                                  fecha_trabajo: Date.now()
                                }
                              },
                              {
                                transaction: t
                              }
                            )
                            .then(nro_operacion_dia => {
                              return models.operacion_caja
                                .create(
                                  {
                                    documento_codigo: documento.documento_codigo, //BODY
                                    documento_serie: documento.documento_serie, //BODY
                                    nro_operacion: nro_operacion + 1,
                                    nro_transaccion: nro_operacion + 1,
                                    nro_transaccion_dia: nro_operacion_dia + 1,
                                    fecha_hora_operacion: Date.now(),
                                    id_cliente: recibo.beneficiario_docident, //BODY
                                    cliente_razon_social:
                                      "RECIBO ANULACION -" + (recibo.recibo_tipo === "INGRESO" ? "EGRESO" : "INGRESO") + " - " + recibo.razon_social, //BODY
                                    oficina_origen_codigo: recibo.oficina_origen_codigo,
                                    caja_codigo: recibo.caja_codigo,
                                    fecha_trabajo: caja.fecha_trabajo,
                                    cuenta_codigo: recibo.cuenta_codigo, ///?????										//BODY
                                    codigo_validador: recibo.codigo_validador, //??									//BODY
                                    concepto: recibo.concepto, ////??																//BODY
                                    tipo_cambio: 0, //BODY
                                    moneda1_Ingre:
                                      recibo.moneda === "SOLES"
                                        ? recibo.recibo_tipo === "EGRESO" || req.body.recibo_tipo === "Reciboegreso"
                                          ? recibo.importe
                                          : 0
                                        : 0, //???suma de valores?????? //BODY
                                    moneda1_Egre:
                                      recibo.moneda === "SOLES"
                                        ? recibo.recibo_tipo === "INGRESO" || recibo.recibo_tipo === "Reciboingreso"
                                          ? recibo.importe
                                          : 0
                                        : 0, //?suma de valores??????			//BODY
                                    moneda2_Ingre:
                                      req.body.moneda === "DOLARES"
                                        ? req.body.recibo_tipo === "EGRESO" || req.body.recibo_tipo === "Reciboegreso"
                                          ? req.body.importe
                                          : 0
                                        : 0,
                                    moneda2_Egre:
                                      req.body.moneda === "DOLARES"
                                        ? req.body.recibo_tipo === "INGRESO" || req.body.recibo_tipo === "Reciboingreso"
                                          ? req.body.importe
                                          : 0
                                        : 0,
                                    moneda3_Ingre: 0,
                                    moneda3_Egre: 0,
                                    modulo: "Recibo interno",
                                    usuario: tokenDecodificado.id,
                                    estado_registro: 3
                                  },
                                  {
                                    transaction: t
                                  }
                                )
                                .then(op_Caja => {
                                  return models.recibo_interno
                                    .update(
                                      {
                                        estado_registro: 3,
                                        anulacion_doc_codigo: op_Caja.documento_codigo,
                                        anulacion_doc_serie: op_Caja.documento_serie,
                                        anulacion_recibo_nro: op_Caja.nro_operacion
                                      },
                                      {
                                        where: {
                                          recibo_doc_codigo: req.body.documento_codigo,
                                          recibo_doc_serie: req.body.documento_serie,
                                          recibo_nro: req.body.nro_operacion
                                        },
                                        transaction: t
                                      }
                                    )
                                    .then(updt => {
                                      return models.recibo_interno.create(
                                        {
                                          recibo_doc_codigo: op_Caja.documento_codigo,
                                          recibo_doc_serie: op_Caja.documento_serie,
                                          recibo_nro: op_Caja.nro_operacion,
                                          recibo_tipo:
                                            recibo.recibo_tipo === "INGRESO" || recibo.recibo_tipo === "Reciboingreso" ? "EGRESO" : "INGRESO",
                                          recibo_finalidad: recibo.recibo_finalidad,
                                          cuenta_codigo: recibo.cuenta_codigo,
                                          id_cliente: recibo.id_cliente,
                                          razon_social: recibo.razon_social,
                                          recibo_concepto: recibo.recibo_concepto,
                                          moneda: recibo.moneda,
                                          importe: recibo.importe,
                                          recibo_obs: req.body.recibo_obs,
                                          centro_costo_id: recibo.centro_costo_id,
                                          recibo_fecha_hora: Date.now(),
                                          estado_registro: 4
                                        },
                                        {
                                          transaction: t
                                        }
                                      );
                                    });
                                });
                            });
                        });
                    });
                });
            }
          )
          .then(resp => {
            res.json(resp);
          })
          .catch(err => {
            logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
            res.status(409).send(err.message);
          });
      });
    });
  });
};

exports.buscar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.recibo_interno
    .findOne({
      where: {
        recibo_doc_codigo: req.params.documento_codigo,
        recibo_doc_serie: req.params.documento_serie,
        recibo_nro: req.params.nro_operacion
      }
    })
    .then(objeto => {
      if (objeto) {
        res.json(objeto);
      } else {
        logger.log("warn", { ubicacion: filename, token: token, message: "No se encontro la operacion" });
        res.status(409).send("No se encontro la operacion");
      }
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.json({
        error: err.errors
      });
    });
};

exports.actualizar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.recibo_interno
    .update(
      {
        recibo_tipo: req.body.recibo_tipo,
        recibo_finalidad: req.body.recibo_finalidad,
        cuenta_codigo: req.body.cuenta_codigo,
        id_cliente: req.body.id_cliente,
        razon_social: req.body.razon_social,
        recibo_concepto: req.body.recibo_concepto,
        moneda: req.body.moneda,
        importe: req.body.importe,
        recibo_obs: req.body.recibo_obs,
        centro_costo_id: req.body.centro_costo_id,
        recibo_fecha_hora: req.body.recibo_fecha_hora
      },
      {
        where: {
          recibo_doc_codigo: req.params.recibo_doc_codigo,
          recibo_doc_serie: req.params.recibo_doc_serie,
          recibo_nro: req.params.recibo_nro
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
  models.recibo_interno
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
  models.recibo_interno
    .findAll({
      where: {
        id_cliente: req.params.id_cliente || req.query.id_cliente,
        cuenta_codigo: req.params.cuenta_codigo || req.query.cuenta_codigo
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
  models.recibo_interno
    .destroy({
      where: {
        recibo_doc_codigo: req.params.recibo_doc_codigo,
        recibo_doc_serie: req.params.recibo_doc_serie,
        recibo_nro: req.params.recibo_nro
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

function getSaldoCaja(fechaTrabajo, cajaCodigo) {
  return new Promise((resolve, reject) => {
    models.sequelize
      .query(`select * from obtener_saldos_caja(:fechaTrabajo, :cajacodigo)`, {
        replacements: {
          fechaTrabajo: fechaTrabajo,
          cajacodigo: cajaCodigo
        },
        type: models.sequelize.QueryTypes.SELECT
      })
      .then(totales => {
        totales = totales[0];
        //comparar con los montos ingresados
        const saldo1bd = parseFloat(totales.Saldo1);
        const saldo2bd = parseFloat(totales.Saldo2);
        const saldo3bd = parseFloat(totales.Saldo3);
        resolve({
          saldo1: saldo1bd,
          saldo2: saldo2bd,
          saldo3: saldo3bd
        });
      })
      .catch(err => {
        reject(err);
      });
  });
}
