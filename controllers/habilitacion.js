const Sequelize = require("sequelize");
const models = require("../models");
const utils = require("../services/utils")
const moment = require('moment');
const cache = require("../config/cache");
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.crear = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  var socket = req.app.get("socketio");

  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      //OBTENER DATOS DE CAJA DESDE REDIS
      redis.get(tokenDecodificado.idc, (err, caja) => {
        //INICIA TRANSACCION
        return models.sequelize
          .transaction(
            {
              isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
            },
            t => {
              caja = JSON.parse(caja);
              if (req.body.importe === 0) {
                throw new Error("El importe debe ser mayor a 0");
              }
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
                  //verificar saldo de caja
                  const hoy = new Date();
                  const yyyy = hoy.getFullYear();
                  const mm = ("0" + (hoy.getMonth() + 1)).slice(-2);
                  const dd = ("0" + hoy.getDate()).slice(-2);
                  const fechaHoy = `${yyyy}-${mm}-${dd}`;

                  await getSaldoCaja(fechaHoy, tokenDecodificado.idc).then(saldos => {
                    //si caja no cuenta con saldo suficiente botar error
                    if (req.body.moneda === "SOLES" && caja.verificar_saldo_caja == "VERIFICAR") {
                      if (saldos.saldo1 < req.body.importe) {
                        throw new Error(`Su caja no cuenta con saldo suficiente.`);
                      }
                    } else if (req.body.moneda === "DOLARES" && caja.verificar_saldo_caja == "VERIFICAR") {
                      if (saldos.saldo2 < req.body.importe) {
                        throw new Error(`Su caja no cuenta con saldo suficiente.`);
                      }
                    }
                  });

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
                            cliente_razon_social: "Habilitacion -" + req.body.destino_oficina_codigo, //BODY
                            oficina_origen_codigo: usuario.oficina_codigo,
                            caja_codigo: tokenDecodificado.idc,
                            fecha_trabajo: caja.fecha_trabajo,
                            cuenta_codigo: req.body.cuenta_codigo, ///?????										//BODY
                            codigo_validador: req.body.codigo_validador, //??									//BODY
                            concepto: req.body.concepto, ////??																//BODY
                            tipo_cambio: 0, //BODY
                            moneda1_Ingre: 0, //???suma de valores?????? //BODY
                            moneda1_Egre: req.body.moneda === "SOLES" ? parseFloat(req.body.importe) : 0, //?suma de valores??????			//BODY
                            moneda2_Ingre: 0,
                            moneda2_Egre: req.body.moneda === "DOLARES" ? parseFloat(req.body.importe) : 0,
                            moneda3_Ingre: 0,
                            moneda3_Egre: 0,
                            modulo: "Habilitacion",
                            usuario: tokenDecodificado.id,
                            estado_registro: 1
                          },
                          {
                            transaction: t
                          }
                        )
                        .then(op_Caja => {
                          return models.habilitacion.create(
                            {
                              origen_docu_codigo: op_Caja.documento_codigo,
                              origen_docu_serie: op_Caja.documento_serie,
                              origen_nro_operacion: op_Caja.nro_operacion,
                              origen_oficina_codigo: op_Caja.oficina_origen_codigo,
                              origen_caja_codigo: op_Caja.caja_codigo,
                              tipo_habilitacion: req.body.tipo_habilitacion, //
                              importe: parseFloat(req.body.importe),
                              moneda: req.body.moneda,
                              habilitacion_estado: "PENDIENTE",
                              destino_oficina_codigo: req.body.destino_oficina_codigo,
                              destino_caja_codigo: req.body.destino_caja_codigo,
                              encargado_operacion_id_cliente: req.body.encargado_operacion_id_cliente,
                              autorizada: 1
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
            //ENVIAR POR SOCKETIO A LA CAJA DE DESTINO
            socket.emit(result.destino_caja_codigo, result);
            //agregue para cambiar notificacion
            let oficina_origen;
            let oficina_destino;
            let caja_origen;
            let caja_destino;
            models.sequelize
            .query(
              `select ofio.oficina_nombre as oficina_origen,ofid.oficina_nombre as oficina_destino, cjo.caja_nombre as caja_origen, cjd.caja_nombre as caja_destino
              from habilitacion h left join oficina ofio on (h.destino_oficina_codigo = ofio.oficina_codigo) left join oficina ofid on (h.origen_oficina_codigo = ofid.oficina_codigo) left join caja cjo on (h.origen_caja_codigo = cjo.caja_codigo) left join caja cjd on (h.destino_caja_codigo = cjd.caja_codigo)
              where h.origen_docu_codigo = '${result.origen_docu_codigo}' and h.origen_docu_serie = ${result.origen_docu_serie} and h.origen_nro_operacion = ${result.origen_nro_operacion}`,
              {
              type: models.sequelize.QueryTypes.SELECT
              }
            )
            .then(respuesta => {
              oficina_origen = respuesta[0].oficina_origen;
              oficina_destino = respuesta[0].oficina_destino;
              caja_origen = respuesta[0].caja_origen;
              caja_destino = respuesta[0].caja_destino;
              NotificacionEgreso(
                redis,
                socket,
                "HABILITACION",
                result.importe,
                `Habilitacion realizada por un monto de ${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(result.importe)}`,
                `Origen: ${caja_origen} Destino: ${caja_destino}`,
                `${result.origen_docu_codigo}${result.origen_docu_serie}-${result.origen_nro_operacion}`,
                tokenDecodificado.id
              );
            });
            
            res.json(result);
            // Transaction has been committed
            // result is whatever the result of the promise chain returned to the transaction callback
          })
          .catch(err => {
            logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
            res.status(412).send(err.toString());
            // Transaction has been rolled back
            // err is whatever rejected the promise chain returned to the transaction callback
          });
      });
    });
  });
};

exports.amortizacion = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  var socket = req.app.get("socketio");

  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      //OBTENER DATOS DE CAJA DESDE REDIS
      redis.get(tokenDecodificado.idc, (err, caja) => {
        //INICIA TRANSACCION
        return models.sequelize
          .transaction(
            {
              isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
            },
            t => {
              caja = JSON.parse(caja);
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
                            cliente_razon_social: req.body.beneficiario_razon_social, //BODY
                            oficina_origen_codigo: usuario.oficina_codigo,
                            caja_codigo: tokenDecodificado.idc,
                            fecha_trabajo: caja.fecha_trabajo,
                            cuenta_codigo: req.body.cuenta_codigo, ///?????										//BODY
                            codigo_validador: req.body.codigo_validador, //??									//BODY
                            concepto: req.body.concepto, ////??																//BODY
                            tipo_cambio: 0, //BODY
                            moneda1_Ingre: req.body.moneda === "SOLES" ? parseFloat(req.body.importe) : 0, //?suma de valores??????			//BODY
                            moneda1_Egre: 0, //???suma de valores?????? //BODY
                            moneda2_Ingre: req.body.moneda === "DOLARES" ? parseFloat(req.body.importe) : 0,
                            moneda2_Egre: 0,
                            moneda3_Ingre: 0,
                            moneda3_Egre: 0,
                            modulo: "Habilitacion",
                            usuario: tokenDecodificado.id,
                            estado_registro: 2
                          },
                          {
                            transaction: t
                          }
                        )
                        .then(op_Caja => {
                          return models.habilitacion.create(
                            {
                              origen_docu_codigo: op_Caja.documento_codigo,
                              origen_docu_serie: op_Caja.documento_serie,
                              origen_nro_operacion: op_Caja.nro_operacion,
                              origen_oficina_codigo: req.body.destino_oficina_codigo,
                              origen_caja_codigo: req.body.destino_caja_codigo,
                              tipo_habilitacion: req.body.tipo_habilitacion, //
                              importe: parseFloat(req.body.importe),
                              moneda: req.body.moneda,
                              habilitacion_estado: "ACEPTADO",
                              destino_oficina_codigo: op_Caja.oficina_origen_codigo,
                              destino_caja_codigo: op_Caja.caja_codigo,
                              encargado_operacion_id_cliente: req.body.encargado_operacion_id_cliente,
                              autorizada: 1 //
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
            //agregue para cambiar notificacion
            let oficina_origen;
            let oficina_destino;
            let caja_origen;
            let caja_destino;
            models.sequelize
            .query(
              `select ofio.oficina_nombre as oficina_origen,ofid.oficina_nombre as oficina_destino, cjo.caja_nombre as caja_origen, cjd.caja_nombre as caja_destino
              from habilitacion h left join oficina ofio on (h.destino_oficina_codigo = ofio.oficina_codigo) left join oficina ofid on (h.origen_oficina_codigo = ofid.oficina_codigo) left join caja cjo on (h.origen_caja_codigo = cjo.caja_codigo) left join caja cjd on (h.destino_caja_codigo = cjd.caja_codigo)
              where h.origen_docu_codigo = '${result.origen_docu_codigo}' and h.origen_docu_serie = ${result.origen_docu_serie} and h.origen_nro_operacion = ${result.origen_nro_operacion}`,
              {
              type: models.sequelize.QueryTypes.SELECT
              }
            )
            .then(respuesta => {
              oficina_origen = respuesta[0].oficina_origen;
              oficina_destino = respuesta[0].oficina_destino;
              caja_origen = respuesta[0].caja_origen;
              caja_destino = respuesta[0].caja_destino;
              NotificacionIngreso(
                redis,
                socket,
                "AMORTIZACION",
                result.importe,
                `Amortizacion realizada por un monto de ${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(result.importe)}`,
                `Origen: ${caja_origen} Destino: ${caja_destino}`,
                `${result.origen_docu_codigo}${result.origen_docu_serie}-${result.origen_nro_operacion}`,
                tokenDecodificado.id
              );
            });
            
            res.json(result);
            // Transaction has been committed
            // result is whatever the result of the promise chain returned to the transaction callback
          })
          .catch(err => {
            logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
            res.status(412).send("error");
            // Transaction has been rolled back
            // err is whatever rejected the promise chain returned to the transaction callback
          });
      });
    });
  });
};

exports.aceptar = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  var socket = req.app.get("socketio");

  let habilitacionBuscada;
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      //OBTENER DATOS DE CAJA DESDE REDIS
      redis.get(tokenDecodificado.idc, (err, caja) => {
        //INICIA TRANSACCION
        let opCaja;
        let opsCajaAceptar;
        return models.sequelize
          .transaction(t => {
            caja = JSON.parse(caja);
            //PBTNER NUMERO DE OPERACION
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
                opsCajaAceptar= opsCaja;
                let nro_operacion;
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
                //OBTNER NUMEO DE OPERACOIN DEL DIA
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
                    //BUSCAR DATOS DE LA TRANSFERENCIA
                    return models.habilitacion
                      .findOne({
                        where: {
                          origen_docu_codigo: req.body.origen_docu_codigo,
                          origen_docu_serie: req.body.origen_docu_serie,
                          origen_nro_operacion: req.body.origen_nro_operacion
                        },
                        lock: t.LOCK.UPDATE,
                        transaction: t
                      })
                      .then(habilitacion => {
                        habilitacionBuscada = habilitacion;
                        //verificar estado de la transferencia
                        if (habilitacion.habilitacion_estado === "ACEPTADO") {
                          throw new Error("Habilitacion ya fue aceptada");
                        } else if (habilitacion.habilitacion_estado === "ANULADO") {
                          throw new Error("Habilitacion se encuentra anulada");
                        }
                        //CREAR UNA OPERACION DE CAJA
                        return models.operacion_caja
                          .create(
                            {
                              documento_codigo: req.body.documento_codigo, //BODY
                              documento_serie: req.body.documento_serie, //BODY
                              nro_operacion: nro_operacion + 1,
                              nro_transaccion: nro_operacion + 1,
                              nro_transaccion_dia: nro_operacion_dia + 1,
                              fecha_hora_operacion: Date.now(),
                              id_cliente: habilitacion.encagado_operacion_id_cliente, //BODY
                              cliente_razon_social:
                                "Habilitacion " +
                                req.body.origen_docu_codigo +
                                req.body.origen_docu_serie +
                                "|" +
                                req.body.origen_nro_operacion +
                                " ACEPTADA",
                              oficina_origen_codigo: usuario.oficina_codigo,
                              caja_codigo: tokenDecodificado.idc,
                              fecha_trabajo: caja.fecha_trabajo,
                              cuenta_codigo: req.body.cuenta_codigo, ///?????										//BODY
                              codigo_validador: req.body.codigo_validador, //??									//BODY
                              concepto: habilitacion.tipo_habilitacion, ////??																//BODY
                              tipo_cambio: 0, //BODY
                              moneda1_Ingre: habilitacion.moneda === "SOLES" ? habilitacion.importe : 0, //???suma de valores?????? //BODY
                              moneda1_Egre: 0, //?suma de valores??????			//BODY
                              moneda2_Ingre: habilitacion.moneda === "DOLARES" ? habilitacion.importe : 0,
                              moneda2_Egre: 0,
                              moneda3_Ingre: 0,
                              moneda3_Egre: 0,
                              modulo: "Habilitacion",
                              usuario: tokenDecodificado.id,
                              estado_registro: 2
                            },
                            {
                              transaction: t
                            }
                          )
                          .then(op_Caja => {
                            opCaja = op_Caja;
                            //ACTUALIZAR ESTADO DE LA TRANSFERENCIA
                            return models.habilitacion.update(
                              {
                                habilitacion_estado: "ACEPTADO",
                                destino_documento_codigo: op_Caja.documento_codigo,
                                destino_documento_serie: op_Caja.documento_serie,
                                destino_nro_operacion: op_Caja.nro_operacion
                              },
                              {
                                where: {
                                  origen_docu_codigo: req.body.origen_docu_codigo,
                                  origen_docu_serie: req.body.origen_docu_serie,
                                  origen_nro_operacion: req.body.origen_nro_operacion
                                },
                                transaction: t
                              }
                            );
                          });
                      });
                  });
              });
          })
          .then(result => {
            //agregue para cambiar notificacion
            let oficina_origen;
            let oficina_destino;
            let caja_origen;
            let caja_destino;
            models.sequelize
            .query(
              `select ofio.oficina_nombre as oficina_origen,ofid.oficina_nombre as oficina_destino, cjo.caja_nombre as caja_origen, cjd.caja_nombre as caja_destino
              from habilitacion h left join oficina ofio on (h.destino_oficina_codigo = ofio.oficina_codigo) left join oficina ofid on (h.origen_oficina_codigo = ofid.oficina_codigo) left join caja cjo on (h.origen_caja_codigo = cjo.caja_codigo) left join caja cjd on (h.destino_caja_codigo = cjd.caja_codigo)
              where h.origen_docu_codigo = '${req.body.origen_docu_codigo}' and h.origen_docu_serie = ${req.body.origen_docu_serie} and h.origen_nro_operacion = ${req.body.origen_nro_operacion}`,
              {
              type: models.sequelize.QueryTypes.SELECT
              }
            )
            .then(respuesta => {
              oficina_origen = respuesta[0].oficina_origen;
              oficina_destino = respuesta[0].oficina_destino;
              caja_origen = respuesta[0].caja_origen;
              caja_destino = respuesta[0].caja_destino;
              NotificacionIngreso(
                redis,
                socket,
                "HABILITACION",
                habilitacionBuscada.importe,
                `Habilitacion aceptada por un monto de ${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(habilitacionBuscada.importe)}`,
                `Origen: ${caja_origen} Destino: ${caja_destino}`,
                `${opCaja.documento_codigo}${opCaja.documento_serie}-${opCaja.nro_operacion}`,
                tokenDecodificado.id
              );
            });
            
            res.json({
              documento_codigo: opCaja.documento_codigo,
              documento_serie: opCaja.documento_serie,
              nro_operacion: opCaja.nro_operacion
            });
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

exports.autorizarAnulacion = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  utils.decodeToken(token, tokenDecodificado => {
    return models.sequelize
      .transaction(t => {
        return models.habilitacion
          .findOne({
            where: {
              origen_docu_codigo: req.body.origen_docu_codigo,
              origen_docu_serie: req.body.origen_docu_serie,
              origen_nro_operacion: req.body.origen_nro_operacion
            },
            lock: t.LOCK.UPDATE,
            transaction: t
          })
          .then(habilitacion => {
            if (
              habilitacion.habilitacion_estado == "ACEPTADO" &&
              (habilitacion.tipo_habilitacion === "ENTRECAJAS" || habilitacion.tipo_habilitacion === "DEPOSITO")
            ) {
              throw new Error("La habilitacion ya fue aceptada por la oficina destino");
            } else if (habilitacion.habilitacion_estado == "ANULADO") {
              throw new Error("La habilitacion ya fue anulada");
            }
            return models.habilitacion.update(
              {
                autorizada: 2,
                usuario_autorizacion: tokenDecodificado.id,
                fecha_hora_autorizacion: Date.now()
              },
              {
                where: {
                  origen_docu_codigo: req.body.origen_docu_codigo,
                  origen_docu_serie: req.body.origen_docu_serie,
                  origen_nro_operacion: req.body.origen_nro_operacion
                },
                transaction: t
              }
            );
          });
      })
      .then(result => {
        res.json(result);
      })
      .catch(err => {
        logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
        res.status(409).send(err.message);
      });
  });
};

exports.anular = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  var socket = req.app.get("socketio");
  let habilitacionBuscada;
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      //OBTENER DATOS DE CAJA DESDE REDIS
      redis.get(tokenDecodificado.idc, (err, caja) => {
        //INICIA TRANSACCION
        return models.sequelize
          .transaction(t => {
            caja = JSON.parse(caja);
            //PBTNER NUMERO DE OPERACION
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
                //OBTNER NUMEO DE OPERACOIN DEL DIA
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
                    //BUSCAR DATOS DE LA TRANSFERENCIA
                    return models.habilitacion
                      .findOne({
                        where: {
                          origen_docu_codigo: req.body.origen_docu_codigo,
                          origen_docu_serie: req.body.origen_docu_serie,
                          origen_nro_operacion: req.body.origen_nro_operacion
                        },
                        lock: t.LOCK.UPDATE,
                        transaction: t
                      })
                      .then(habilitacion => {
                        habilitacionBuscada = habilitacion;
                        //verificar estado de la transferencia
                        if (habilitacion.habilitacion_estado === "ACEPTADO") {
                          throw new Error("Habilitación ya fue aceptada");
                        } else if (habilitacion.habilitacion_estado === "ANULADO") {
                          throw new Error("Habilitación se encuentra anulada");
                        } else if (habilitacion.autorizada === 1) {
                          throw new Error("Habilitación no autorizada para anulación");
                        }
                        //CREAR UNA OPERACION DE CAJA
                        return models.operacion_caja
                          .create(
                            {
                              documento_codigo: req.body.documento_codigo,
                              documento_serie: req.body.documento_serie,
                              nro_operacion: nro_operacion + 1,
                              nro_transaccion: nro_operacion + 1,
                              nro_transaccion_dia: nro_operacion_dia + 1,
                              fecha_hora_operacion: Date.now(),
                              id_cliente: habilitacion.encagado_operacion_id_cliente,
                              cliente_razon_social:
                                "Habilitacion " +
                                req.body.origen_docu_codigo +
                                req.body.origen_docu_serie +
                                req.body.origen_nro_operacion +
                                " ANULADA",
                              oficina_origen_codigo: usuario.oficina_codigo,
                              caja_codigo: tokenDecodificado.idc,
                              fecha_trabajo: caja.fecha_trabajo,
                              cuenta_codigo: req.body.cuenta_codigo,
                              codigo_validador: req.body.codigo_validador,
                              concepto: req.body.motivo,
                              tipo_cambio: 0,
                              moneda1_Ingre: habilitacion.moneda === "SOLES" ? habilitacion.importe : 0, //???suma de valores?????? //BODY
                              moneda1_Egre: 0, //?suma de valores??????			//BODY
                              moneda2_Ingre: habilitacion.moneda === "DOLARES" ? habilitacion.importe : 0,
                              moneda2_Egre: 0,
                              moneda3_Ingre: 0,
                              moneda3_Egre: 0,
                              modulo: "Habilitacion",
                              usuario: tokenDecodificado.id,
                              estado_registro: 3
                            },
                            {
                              transaction: t
                            }
                          )
                          .then(op_Caja => {
                            //ACTUALIZAR ESTADO DE LA TRANSFERENCIA
                            return models.habilitacion.update(
                              {
                                habilitacion_estado: "ANULADO"
                              },
                              {
                                where: {
                                  origen_docu_codigo: req.body.origen_docu_codigo,
                                  origen_docu_serie: req.body.origen_docu_serie,
                                  origen_nro_operacion: req.body.origen_nro_operacion
                                },
                                transaction: t
                              }
                            );
                          });
                      });
                  });
              });
          })
          .then(result => {
            //agregue para cambiar notificacion
            let oficina_origen;
            let oficina_destino;
            let caja_origen;
            let caja_destino;
            models.sequelize
            .query(
              `select ofio.oficina_nombre as oficina_origen,ofid.oficina_nombre as oficina_destino, cjo.caja_nombre as caja_origen, cjd.caja_nombre as caja_destino
              from habilitacion h left join oficina ofio on (h.destino_oficina_codigo = ofio.oficina_codigo) left join oficina ofid on (h.origen_oficina_codigo = ofid.oficina_codigo) left join caja cjo on (h.origen_caja_codigo = cjo.caja_codigo) left join caja cjd on (h.destino_caja_codigo = cjd.caja_codigo)
              where h.origen_docu_codigo = '${habilitacionBuscada.origen_docu_codigo}' and h.origen_docu_serie = ${habilitacionBuscada.origen_docu_serie} and h.origen_nro_operacion = ${habilitacionBuscada.origen_nro_operacion}`,
              {
              type: models.sequelize.QueryTypes.SELECT
              }
            )
            .then(respuesta => {
              oficina_origen = respuesta[0].oficina_origen;
              oficina_destino = respuesta[0].oficina_destino;
              caja_origen = respuesta[0].caja_origen;
              caja_destino = respuesta[0].caja_destino;
              NotificacionIngreso(
                redis,
                socket,
                "HABILITACION",
                habilitacionBuscada.importe,
                `Habilitacion ANULADA por un monto de ${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(habilitacionBuscada.importe)}`,
                `Origen: ${caja_origen} Destino: ${caja_destino}`,
                `${habilitacionBuscada.origen_docu_codigo}${habilitacionBuscada.origen_docu_serie}-${habilitacionBuscada.origen_nro_operacion}`,
                tokenDecodificado.id
              );
            });
            
            res.json({
              nro_operacion: result
            });
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

exports.anularAmortizacion = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  var socket = req.app.get("socketio");
  let habilitacionBuscada;
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      //OBTENER DATOS DE CAJA DESDE REDIS
      redis.get(tokenDecodificado.idc, (err, caja) => {
        //INICIA TRANSACCION
        return models.sequelize
          .transaction(t => {
            caja = JSON.parse(caja);
            //PBTNER NUMERO DE OPERACION
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
                //OBTNER NUMEO DE OPERACOIN DEL DIA
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
                    //BUSCAR DATOS DE LA TRANSFERENCIA
                    return models.habilitacion
                      .findOne({
                        where: {
                          origen_docu_codigo: req.body.origen_docu_codigo,
                          origen_docu_serie: req.body.origen_docu_serie,
                          origen_nro_operacion: req.body.origen_nro_operacion
                        },
                        lock: t.LOCK.UPDATE,
                        transaction: t
                      })
                      .then(habilitacion => {
                        habilitacionBuscada = habilitacion;
                        //verificar estado de la transferencia
                        if (habilitacion.habilitacion_estado === "ANULADO") {
                          throw new Error("Habilitacion se encuentra anulada");
                        } else if (habilitacion.autorizada === 1) {
                          throw new Error("Habilitación no autorizada para anulación");
                        }
                        //CREAR UNA OPERACION DE CAJA
                        return models.operacion_caja
                          .create(
                            {
                              documento_codigo: req.body.documento_codigo, //BODY
                              documento_serie: req.body.documento_serie, //BODY
                              nro_operacion: nro_operacion + 1,
                              nro_transaccion: nro_operacion + 1,
                              nro_transaccion_dia: nro_operacion_dia + 1,
                              fecha_hora_operacion: Date.now(),
                              id_cliente: habilitacion.encagado_operacion_id_cliente, //BODY
                              cliente_razon_social:
                                "AMORTIZACION " +
                                req.body.origen_docu_codigo +
                                req.body.origen_docu_serie +
                                req.body.origen_nro_operacion +
                                " ANULADA",
                              oficina_origen_codigo: usuario.oficina_codigo,
                              caja_codigo: tokenDecodificado.idc,
                              fecha_trabajo: caja.fecha_trabajo,
                              cuenta_codigo: req.body.cuenta_codigo, ///?????										//BODY
                              codigo_validador: req.body.codigo_validador, //??									//BODY
                              concepto: req.body.motivo, ////??																//BODY
                              tipo_cambio: 0, //BODY
                              moneda1_Ingre: 0, //???suma de valores?????? //BODY
                              moneda1_Egre: habilitacion.moneda === "SOLES" ? habilitacion.importe : 0, //?suma de valores??????			//BODY
                              moneda2_Ingre: 0,
                              moneda2_Egre: habilitacion.moneda === "DOLARES" ? habilitacion.importe : 0,
                              moneda3_Ingre: 0,
                              moneda3_Egre: 0,
                              modulo: "Habilitacion",
                              usuario: tokenDecodificado.id,
                              estado_registro: 3
                            },
                            {
                              transaction: t
                            }
                          )
                          .then(op_Caja => {
                            //ACTUALIZAR ESTADO DE LA TRANSFERENCIA
                            return models.habilitacion.update(
                              {
                                habilitacion_estado: "ANULADO"
                              },
                              {
                                where: {
                                  origen_docu_codigo: req.body.origen_docu_codigo,
                                  origen_docu_serie: req.body.origen_docu_serie,
                                  origen_nro_operacion: req.body.origen_nro_operacion
                                },
                                transaction: t
                              }
                            );
                          });
                      });
                  });
              });
          })
          .then(result => {
            //agregue para cambiar notificacion
            let oficina_origen;
            let oficina_destino;
            let caja_origen;
            let caja_destino;
            models.sequelize
            .query(
              `select ofio.oficina_nombre as oficina_origen,ofid.oficina_nombre as oficina_destino, cjo.caja_nombre as caja_origen, cjd.caja_nombre as caja_destino
              from habilitacion h left join oficina ofio on (h.destino_oficina_codigo = ofio.oficina_codigo) left join oficina ofid on (h.origen_oficina_codigo = ofid.oficina_codigo) left join caja cjo on (h.origen_caja_codigo = cjo.caja_codigo) left join caja cjd on (h.destino_caja_codigo = cjd.caja_codigo)
              where h.origen_docu_codigo = '${habilitacionBuscada.origen_docu_codigo}' and h.origen_docu_serie = ${habilitacionBuscada.origen_docu_serie} and h.origen_nro_operacion = ${habilitacionBuscada.origen_nro_operacion}`,
              {
              type: models.sequelize.QueryTypes.SELECT
              }
            )
            .then(respuesta => {
              oficina_origen = respuesta[0].oficina_origen;
              oficina_destino = respuesta[0].oficina_destino;
              caja_origen = respuesta[0].caja_origen;
              caja_destino = respuesta[0].caja_destino;
              NotificacionIngreso(
                redis,
                socket,
                "AMORTIZACION",
                habilitacionBuscada.importe,
                `Amortizacion ANULADA por un monto de ${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(habilitacionBuscada.importe)}`,
                `Origen: ${caja_origen} Destino: ${caja_destino}`,
                `${habilitacionBuscada.origen_docu_codigo}${habilitacionBuscada.origen_docu_serie}-${habilitacionBuscada.origen_nro_operacion}`,
                tokenDecodificado.id
              );
            });
            
            res.json({
              nro_operacion: result
            });
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

exports.anularCentral = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  var socket = req.app.get("socketio");
  let habilitacionBuscada;
  if (req.body.motivo && req.body.motivo !== "") {
    utils.decodeToken(token, tokenDecodificado => {
      //OBTENER DATOS DEL USUARIO DESDE REDIS
      redis.get(tokenDecodificado.id, async (err, usuario) => {
        usuario = JSON.parse(usuario);

        //INICIA TRANSACCION
        return models.sequelize
          .transaction(t => {
            return models.habilitacion
              .findOne({
                where: {
                  origen_docu_codigo: req.body.origen_docu_codigo,
                  origen_docu_serie: req.body.origen_docu_serie,
                  origen_nro_operacion: req.body.origen_nro_operacion
                },
                lock: t.LOCK.UPDATE,
                transaction: t
              })
              .then(async habilitacion => {
                habilitacionBuscada = habilitacion;
                //verificar estado de la transferencia
                if (habilitacion.habilitacion_estado === "ACEPTADO") {
                  throw new Error("Habilitacion ya fue aceptada");
                } else if (habilitacion.habilitacion_estado === "ANULADO") {
                  throw new Error("Habilitacion se encuentra anulada");
                }

                const documentoSerie = await models.documento_serie.findOne({
                  attributes: ["documento_codigo", "documento_serie"],
                  where: {
                    estado_registro: true,
                    oficina_codigo: habilitacion.origen_oficina_codigo,
                    modulo: "Reciboingreso",
                    estado_registro: true
                  }
                });

                if (documentoSerie == null) {
                  throw new Error("Oficina no cuenta con documento para realizar anulacion");
                }

                const habilitacion_op_caja = await models.operacion_caja.findOne({
                  where: {
                    documento_codigo: req.body.origen_docu_codigo,
                    documento_serie: req.body.origen_docu_serie,
                    nro_operacion: req.body.origen_nro_operacion
                  }
                });

                //abrir caja en caso este cerrada y validar si esta abierta o cerrada
                await getCajaRedis(redis, habilitacion_op_caja.caja_codigo, tokenDecodificado.idc);

                return models.operacion_caja
                  .findAll(
                    {
                      limit: 1,
                      where: {
                        documento_codigo: documentoSerie.documento_codigo,
                        documento_serie: documentoSerie.documento_serie
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
                          documento_codigo: documentoSerie.documento_codigo,
                          documento_serie: documentoSerie.documento_serie
                        }
                      });
                      nro_operacion = parseInt(docSerie.nro_inicio) - 1;
                    } else {
                      nro_operacion = opsCaja[0].nro_operacion;
                    }

                    //OBTIENE EL NUMERO DE OPERACION DEL DIA
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
                              documento_codigo: documentoSerie.documento_codigo, //BODY
                              documento_serie: documentoSerie.documento_serie, //BODY
                              nro_operacion: nro_operacion + 1,
                              nro_transaccion: nro_operacion + 1,
                              nro_transaccion_dia: nro_operacion_dia + 1,
                              fecha_hora_operacion: Date.now(),
                              cliente_razon_social:
                                "Habilitacion " +
                                habilitacion.origen_docu_codigo +
                                habilitacion.origen_docu_serie +
                                habilitacion.origen_nro_operacion +
                                " ANULADA",
                              oficina_origen_codigo: habilitacion.origen_oficina_codigo,
                              caja_codigo: habilitacion_op_caja.caja_codigo,
                              fecha_trabajo: Date.now(),
                              concepto: req.body.motivo, ////??																//BODY
                              tipo_cambio: 0, //BODY
                              moneda1_Ingre: habilitacion.moneda == "SOLES" ? parseFloat(habilitacion.importe) : 0, //?suma de valores??????			//BODY
                              moneda1_Egre: 0,
                              moneda2_Ingre: habilitacion.moneda == "DOLARES" ? parseFloat(habilitacion.importe) : 0,
                              moneda2_Egre: 0,
                              moneda3_Ingre: 0,
                              moneda3_Egre: 0,
                              modulo: "Habilitacion",
                              usuario: tokenDecodificado.id,
                              registrado_central: true,
                              estado_registro: 3
                            },
                            {
                              transaction: t
                            }
                          )
                          .then(op_Caja => {
                            return models.habilitacion.update(
                              {
                                habilitacion_estado: "ANULADO"
                              },
                              {
                                where: {
                                  origen_docu_codigo: req.body.origen_docu_codigo,
                                  origen_docu_serie: req.body.origen_docu_serie,
                                  origen_nro_operacion: req.body.origen_nro_operacion
                                },
                                transaction: t
                              }
                            );
                          });
                      });
                  });
              });
          })
          .then(result => {
            //agregue para cambiar notificacion
            let oficina_origen;
            let oficina_destino;
            let caja_origen;
            let caja_destino;
            models.sequelize
            .query(
              `select ofio.oficina_nombre as oficina_origen,ofid.oficina_nombre as oficina_destino, cjo.caja_nombre as caja_origen, cjd.caja_nombre as caja_destino
              from habilitacion h left join oficina ofio on (h.destino_oficina_codigo = ofio.oficina_codigo) left join oficina ofid on (h.origen_oficina_codigo = ofid.oficina_codigo) left join caja cjo on (h.origen_caja_codigo = cjo.caja_codigo) left join caja cjd on (h.destino_caja_codigo = cjd.caja_codigo)
              where h.origen_docu_codigo = '${habilitacionBuscada.origen_docu_codigo}' and h.origen_docu_serie = ${habilitacionBuscada.origen_docu_serie} and h.origen_nro_operacion = ${habilitacionBuscada.origen_nro_operacion}`,
              {
              type: models.sequelize.QueryTypes.SELECT
              }
            )
            .then(respuesta => {
              oficina_origen = respuesta[0].oficina_origen;
              oficina_destino = respuesta[0].oficina_destino;
              caja_origen = respuesta[0].caja_origen;
              caja_destino = respuesta[0].caja_destino;
              NotificacionEgreso(
                redis,
                socket,
                "HABILITACION",
                habilitacionBuscada.importe,
                `Habilitacion ANULADA por central, monto: ${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(
                  habilitacionBuscada.importe
                )}`,
                `Origen: ${caja_origen} Destino: ${caja_destino}`,
                `${habilitacionBuscada.origen_docu_codigo}${habilitacionBuscada.origen_docu_serie}-${habilitacionBuscada.origen_nro_operacion}`,
                tokenDecodificado.id
              );
            });
            
            res.json({
              nro_operacion: result
            });
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
  } else {
    res.status(412).send("Ingrese un motivo de anulacion");
  }
};

exports.anularAmortizacionCentral = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  var socket = req.app.get("socketio");
  let habilitacionBuscada;
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, async (err, usuario) => {
      usuario = JSON.parse(usuario);

      //INICIA TRANSACCION
      return models.sequelize
        .transaction(t => {
          return models.habilitacion
            .findOne({
              where: {
                origen_docu_codigo: req.body.origen_docu_codigo,
                origen_docu_serie: req.body.origen_docu_serie,
                origen_nro_operacion: req.body.origen_nro_operacion
              },
              lock: t.LOCK.UPDATE,
              transaction: t
            })
            .then(async habilitacion => {
              habilitacionBuscada = habilitacion;
              //verificar estado de la transferencia
              if (habilitacion.habilitacion_estado === "ANULADO") {
                throw new Error("Amortizacion se encuentra anulada");
              }

              const documentoSerie = await models.documento_serie.findOne({
                attributes: ["documento_codigo", "documento_serie"],
                where: {
                  estado_registro: true,
                  oficina_codigo: habilitacion.destino_oficina_codigo,
                  modulo: "Reciboegreso",
                  estado_registro: true
                }
              });

              if (documentoSerie == null) {
                throw new Error("Oficina no cuenta con documento para realizar anulacion");
              }

              const habilitacion_op_caja = await models.operacion_caja.findOne({
                where: {
                  documento_codigo: req.body.origen_docu_codigo,
                  documento_serie: req.body.origen_docu_serie,
                  nro_operacion: req.body.origen_nro_operacion
                }
              });

              //abrir caja en caso este cerrada y validar si esta abierta o cerrada
              await getCajaRedis(redis, habilitacion_op_caja.caja_codigo, tokenDecodificado.idc);

              return models.operacion_caja
                .findAll(
                  {
                    limit: 1,
                    where: {
                      documento_codigo: documentoSerie.documento_codigo,
                      documento_serie: documentoSerie.documento_serie
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
                        documento_codigo: documentoSerie.documento_codigo,
                        documento_serie: documentoSerie.documento_serie
                      }
                    });
                    nro_operacion = parseInt(docSerie.nro_inicio) - 1;
                  } else {
                    nro_operacion = opsCaja[0].nro_operacion;
                  }

                  //OBTIENE EL NUMERO DE OPERACION DEL DIA
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
                            documento_codigo: documentoSerie.documento_codigo, //BODY
                            documento_serie: documentoSerie.documento_serie, //BODY
                            nro_operacion: nro_operacion + 1,
                            nro_transaccion: nro_operacion + 1,
                            nro_transaccion_dia: nro_operacion_dia + 1,
                            fecha_hora_operacion: Date.now(),
                            cliente_razon_social:
                              "Amortizacion " +
                              habilitacion.origen_docu_codigo +
                              habilitacion.origen_docu_serie +
                              habilitacion.origen_nro_operacion +
                              " ANULADA",
                            oficina_origen_codigo: habilitacion.destino_oficina_codigo,
                            caja_codigo: habilitacion_op_caja.caja_codigo,
                            fecha_trabajo: Date.now(),
                            concepto: req.body.motivo, ////??																//BODY
                            tipo_cambio: 0, //BODY
                            moneda1_Ingre: 0, //?suma de valores??????			//BODY
                            moneda1_Egre: habilitacion.moneda == "SOLES" ? parseFloat(habilitacion.importe) : 0,
                            moneda2_Ingre: 0,
                            moneda2_Egre: habilitacion.moneda == "DOLARES" ? parseFloat(habilitacion.importe) : 0,
                            moneda3_Ingre: 0,
                            moneda3_Egre: 0,
                            modulo: "Habilitacion",
                            usuario: tokenDecodificado.id,
                            registrado_central: true,
                            estado_registro: 3
                          },
                          {
                            transaction: t
                          }
                        )
                        .then(op_Caja => {
                          return models.habilitacion.update(
                            {
                              habilitacion_estado: "ANULADO"
                            },
                            {
                              where: {
                                origen_docu_codigo: req.body.origen_docu_codigo,
                                origen_docu_serie: req.body.origen_docu_serie,
                                origen_nro_operacion: req.body.origen_nro_operacion
                              },
                              transaction: t
                            }
                          );
                        });
                    });
                });
            });
        })
        .then(result => {
          //agregue para cambiar notificacion
          let oficina_origen;
          let oficina_destino;
          let caja_origen;
          let caja_destino;
          models.sequelize
          .query(
            `select ofio.oficina_nombre as oficina_origen,ofid.oficina_nombre as oficina_destino, cjo.caja_nombre as caja_origen, cjd.caja_nombre as caja_destino
            from habilitacion h left join oficina ofio on (h.destino_oficina_codigo = ofio.oficina_codigo) left join oficina ofid on (h.origen_oficina_codigo = ofid.oficina_codigo) left join caja cjo on (h.origen_caja_codigo = cjo.caja_codigo) left join caja cjd on (h.destino_caja_codigo = cjd.caja_codigo)
            where h.origen_docu_codigo = '${habilitacionBuscada.origen_docu_codigo}' and h.origen_docu_serie = ${habilitacionBuscada.origen_docu_serie} and h.origen_nro_operacion = ${habilitacionBuscada.origen_nro_operacion}`,
            {
            type: models.sequelize.QueryTypes.SELECT
            }
          )
          .then(respuesta => {
            oficina_origen = respuesta[0].oficina_origen;
            oficina_destino = respuesta[0].oficina_destino;
            caja_origen = respuesta[0].caja_origen;
            caja_destino = respuesta[0].caja_destino;
            NotificacionEgreso(
              redis,
              socket,
              "AMORTIZACION",
              habilitacionBuscada.importe,
              `Amortizacion ANULADA por central, monto: ${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(
                habilitacionBuscada.importe
              )}`,
              `Origen: ${caja_origen} Destino: ${caja_destino}`,
              `${habilitacionBuscada.origen_docu_codigo}${habilitacionBuscada.origen_docu_serie}-${habilitacionBuscada.origen_nro_operacion}`,
              tokenDecodificado.id
            );
          });
          
          res.json({
            nro_operacion: result
          });
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
};

exports.buscar = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      models.habilitacion
        .findOne({
          where: {
            [Op.or]: [
              {
                origen_docu_codigo: req.params.documento_codigo,
                origen_docu_serie: req.params.documento_serie,
                origen_nro_operacion: req.params.nro_operacion
              },
              {
                destino_documento_codigo: req.params.documento_codigo,
                destino_documento_serie: req.params.documento_serie,
                destino_nro_operacion: req.params.nro_operacion
              }
            ]
          },
          include: [
            {
              attributes: ["oficina_codigo", "oficina_nombre"],
              as: "oficina_origen",
              model: models.oficina,
              required: false
            },
            {
              attributes: ["oficina_codigo", "oficina_nombre"],
              as: "oficina_destino",
              model: models.oficina,
              required: false
            }
          ]
        })
        .then(objeto => {
          if (objeto) {
            res.json(objeto);
          } else {
            logger.log("warn", {
              ubicacion: filename,
              token: token,
              message: "Su habilitacion no existe o usted no puede acceder a esta informacion"
            });
            res.status(400).send("Su habilitacion no existe o usted no puede acceder a esta informacion");
          }
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
          res.status(412).send("Error en consulta");
        });
    });
  });
};

exports.buscarPorID = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      models.documento_serie
        .findOne({
          attributes: ["documento_codigo", "documento_serie"],
          where: {
            oficina_codigo: req.params.oficina_codigo,
            modulo: "Habilitaciones",
            estado_registro: true
          }
        })
        .then(documentoSerie => {
          if (documentoSerie == null) {
            logger.log("warn", { ubicacion: filename, token: token, message: "Oficina no cuenta con documento de habilitaciones" });
            res.status(409).send("Oficina no cuenta con documento de habilitaciones");
            return;
          }

          models.habilitacion
            .findOne({
              where: {
                origen_docu_codigo: documentoSerie.documento_codigo,
                origen_docu_serie: documentoSerie.documento_serie,
                origen_nro_operacion: req.params.nro_operacion,
                origen_oficina_codigo: req.params.oficina_codigo
              },
              include: [
                {
                  attributes: ["oficina_codigo", "oficina_nombre"],
                  as: "oficina_origen",
                  model: models.oficina,
                  required: false
                },
                {
                  attributes: ["oficina_codigo", "oficina_nombre"],
                  as: "oficina_destino",
                  model: models.oficina,
                  required: false
                }
              ]
            })
            .then(objeto => {
              if (objeto) {
                res.json(objeto);
              } else {
                logger.log("warn", {
                  ubicacion: filename,
                  token: token,
                  message: "Su habilitacion no existe o usted no puede acceder a esta informacion"
                });
                res.status(400).send("Su habilitacion no existe o usted no puede acceder a esta informacion");
              }
            })
            .catch(err => {
              logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
              res.status(412).send("Error en consulta");
            });
        });
    });
  });
};

exports.listar = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      models.habilitacion
        .findAll({
          attributes: [
            "origen_caja_codigo",
            "destino_caja_codigo",
            "origen_docu_codigo",
            "origen_docu_serie",
            "origen_nro_operacion",
            "origen_oficina_codigo",
            "destino_oficina_codigo",
            "habilitacion_estado",
            "importe",
            "autorizada",
            "createdAt"
          ],
          include: [
            {
              model: models.oficina,
              as: "oficina_origen",
              attributes: ["oficina_nombre"]
            }
          ],
          where: {
            destino_caja_codigo: usuario.caja_codigo,
            habilitacion_estado: "PENDIENTE"
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
    });
  });
};

exports.listarRealizadas = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      models.habilitacion
        .findAll({
          attributes: [
            "origen_docu_codigo",
            "origen_docu_serie",
            "origen_nro_operacion",
            "habilitacion_estado",
            "tipo_habilitacion",
            "importe",
            "moneda",
            "destino_caja_codigo",
            "createdAt"
          ],
          include: [
            {
              attributes: ["caja_nombre"],
              as: "caja_origen",
              model: models.caja,
              required: false
            },
            {
              attributes: ["caja_nombre"],
              as: "caja_destino",
              model: models.caja,
              required: false
            },
            {
              attributes: ["oficina_nombre"],
              as: "oficina_origen",
              model: models.oficina,
              required: false
            },
            {
              attributes: ["oficina_nombre"],
              as: "oficina_destino",
              model: models.oficina,
              required: false
            }
          ],
          where: {
            [Op.or]: [
              {
                [Op.and]: [{ origen_caja_codigo: usuario.caja_codigo }, { habilitacion_estado: "PENDIENTE" }]
              },
              {
                [Op.and]: [
                  { origen_caja_codigo: usuario.caja_codigo },
                  {
                    createdAt: {
                      [Op.gte]: moment()
                        .subtract(1, "days")
                        .format("L")
                    }
                  }
                ]
              },
              {
                [Op.and]: [
                  { destino_caja_codigo: usuario.caja_codigo },
                  { tipo_habilitacion: "AMORTIZACION" },
                  {
                    createdAt: {
                      [Op.gte]: moment()
                        .subtract(1, "days")
                        .format("L")
                    }
                  }
                ]
              }
            ]
          },
          order: [["createdAt", "DESC"]]
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
    });
  });
};

exports.listarHabilitacionesCentral = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  let origen_oficina_codigo = {};
  let destino_oficina_codigo = {};
  let habilitacion_estado = {};
  let tipo_habilitacion = {};
  if (req.params.oficina_origen != "*") {
    origen_oficina_codigo = { origen_oficina_codigo: req.params.oficina_origen };
  }
  if (req.params.oficina_destino != "*") {
    destino_oficina_codigo = { destino_oficina_codigo: req.params.oficina_destino };
  }
  if (req.params.estado != "*") {
    habilitacion_estado = { habilitacion_estado: req.params.estado };
  }
  if (req.params.tipo != "*") {
    tipo_habilitacion = { tipo_habilitacion: req.params.tipo };
  }

  utils.decodeToken(token, tokenDecodificado => {
    models.habilitacion
      .findAll({
        attributes: [
          "origen_docu_codigo",
          "origen_docu_serie",
          "origen_nro_operacion",
          "habilitacion_estado",
          "tipo_habilitacion",
          "importe",
          "moneda",
          "destino_caja_codigo",
          "autorizada",
          "usuario_autorizacion",
          "fecha_hora_autorizacion",
          "createdAt"
        ],
        include: [
          {
            attributes: ["caja_nombre"],
            as: "caja_origen",
            model: models.caja,
            required: false
          },
          {
            attributes: ["caja_nombre"],
            as: "caja_destino",
            model: models.caja,
            required: false
          },
          {
            attributes: ["oficina_nombre"],
            as: "oficina_origen",
            model: models.oficina,
            required: false
          },
          {
            attributes: ["oficina_nombre"],
            as: "oficina_destino",
            model: models.oficina,
            required: false
          }
        ],
        where: {
          createdAt: { [Op.between]: [req.params.fechaInicio + " 00:00:00.000 -05:00", req.params.fechaFin + " 23:59:59.000 -05:00"] },
          ...origen_oficina_codigo,
          ...destino_oficina_codigo,
          ...habilitacion_estado,
          ...tipo_habilitacion
        },
        order: [["createdAt", "DESC"]]
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
  });
};

exports.listarPor = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.habilitacion
    .findAll({
      where: {
        origen_caja_codigo: req.params.caja_codigo || req.query.caja_codigo,
        encargado_operacion_id_cliente: req.params.id_cliente || req.query.id_cliente
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

function getCajaRedis(redis, caja_codigo, usuario_codigo) {
  return new Promise(async (resolve, reject) => {
    let cajaRedis = await redis.getAsync(caja_codigo);
    if (cajaRedis === null) {
      buscarCajaAbrir(redis, caja_codigo, usuario_codigo)
        .then(caja => {
          resolve(caja);
        })
        .catch(err => {
          reject(err);
        });
    } else {
      cajaRedis = JSON.parse(cajaRedis);
      if (cajaRedis.fecha_trabajo === moment().format("YYYY-MM-DD")) {
        if (cajaRedis.estado_caja === "CERRADO") {
          reject(Error("LA CAJA DE LA OFICINA ORIGEN SE ENCUENTRA CERRADA EL DIA DE HOY"));
        } else {
          resolve(cajaRedis);
        }
      } else {
        buscarCajaAbrir(redis, caja_codigo, usuario_codigo)
          .then(cajared => {
            resolve(cajared);
          })
          .catch(err => {
            reject(err);
          });
      }
    }
  });
}

function buscarCajaAbrir(redis, caja_codigo, usuario_codigo) {
  return new Promise(async (resolve, reject) => {
    const cajaTrabajo = await models.caja_trabajo.findOne({
      where: {
        fecha_trabajo: Date.now(),
        caja_codigo: caja_codigo
      }
    });
    if (cajaTrabajo) {
      cache.setValue(
        caja_codigo,
        JSON.stringify({
          fecha_trabajo: cajaTrabajo.fecha_trabajo,
          usuario_apertura: cajaTrabajo.usuario_apertura,
          estado_caja: cajaTrabajo.estado_caja
        })
      );
      if (cajaTrabajo.estado_caja === "ABIERTO") {
        resolve({
          fecha_trabajo: cajaTrabajo.fecha_trabajo,
          usuario_apertura: cajaTrabajo.usuario_apertura,
          estado_caja: cajaTrabajo.estado_caja
        });
      } else {
        reject(Error("LA CAJA DE LA OFICINA ORIGEN SE ENCUENTRA CERRADA EL DIA DE HOY"));
      }
    } else {
      let cajaAnterior = await models.caja_trabajo.findOne({
        order: [["fecha_trabajo", "DESC"]],
        where: {
          caja_codigo: caja_codigo
        }
      });
      if (cajaAnterior) {
        //SI EXISTE CAJA DEL DIA ANTERIOR
        if (cajaAnterior.estado_caja === "CERRADO") {
          //si esta cerrada la caja del dia anterior, abrir caja
          //const caja_trabajo = await abrirCaja(redis, caja_codigo, usuario_codigo);
          reject(Error("Primero debe abrir caja"));
          resolve(caja_trabajo);
        } else {
          //SI LA CAJA DEL DIA ANTERIOR ESTA ABIERTA
          const mensaje =
            "La caja de la oficina origen del dia " +
            moment(cajaAnterior.fecha_trabajo)
              .locale("es")
              .format("LLLL") +
            ", se encuentra abierta.";
          reject(Error(mensaje));
        }
      } else {
        //SI NO EXISTE NINGUNA CAJA PARA ESA OFICINA, ABRIR CAJA
        const caja_trabajo = await abrirCaja(redis, caja_codigo, usuario_codigo);
        resolve(caja_trabajo);
      }
    }
  });
}

function abrirCaja(redis, caja_codigo, usuario_codigo) {
  return new Promise((resolve, reject) => {
    models.caja_trabajo
      .create({
        fecha_trabajo: Date.now(),
        caja_codigo: caja_codigo,
        usuario_apertura: usuario_codigo,
        fecha_hora_apertura: Date.now(),
        estado_caja: "ABIERTO"
      })
      .then(respuesta => {
        cache.setValue(
          caja_codigo,
          JSON.stringify({
            fecha_trabajo: respuesta.fecha_trabajo,
            usuario_apertura: respuesta.usuario_apertura,
            estado_caja: respuesta.estado_caja
          })
        );
        resolve({
          fecha_trabajo: respuesta.fecha_trabajo,
          usuario_apertura: respuesta.usuario_apertura,
          estado_caja: respuesta.estado_caja
        });
      })
      .catch(err => {
        reject(err);
      });
  });
}