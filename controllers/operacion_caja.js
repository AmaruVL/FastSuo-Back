const Sequelize = require("sequelize");
const models = require("../models");
const moment = require("moment");
const utils = require("../services/utils")
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.crearTipoCambio = (req, res) => {
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
        const hoy = new Date();
        const yyyy = hoy.getFullYear();
        const mm = ("0" + (hoy.getMonth() + 1)).slice(-2);
        const dd = ("0" + hoy.getDate()).slice(-2);
        const fechaHoy = `${yyyy}-${mm}-${dd}`;
        getSaldoCaja(fechaHoy, tokenDecodificado.idc)
          .then(saldos => {
            if (req.body.accion === "VENTA") {
              if (parseFloat(req.body.importe_dolares) > saldos.saldo2) {
                logger.log("warn", { ubicacion: filename, token: token, message: "No tiene dolares suficientes en caja" });
                throw new Error("No tiene dolares suficientes en caja");
              }
            } else if (req.body.accion === "COMPRA") {
              if (parseFloat(req.body.importe_soles) > saldos.saldo1) {
                logger.log("warn", { ubicacion: filename, token: token, message: "No tiene soles suficientes en caja" });
                throw new Error("No tiene soles suficientes en caja");
              }
            } else {
              logger.log("warn", { ubicacion: filename, token: token, message: "Opcion de tipo de cambio no especificada" });
              throw new Error("No se pueden obtener los saldos");
            }

            return models.sequelize
              .transaction(
                {
                  isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
                },
                t => {
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
                          return models.operacion_caja.create(
                            {
                              documento_codigo: req.body.documento_codigo, //BODY
                              documento_serie: req.body.documento_serie, //BODY
                              nro_operacion: nro_operacion + 1,
                              nro_transaccion: nro_operacion + 1,
                              nro_transaccion_dia: nro_operacion_dia + 1,
                              fecha_hora_operacion: Date.now(),
                              cliente_razon_social: req.body.cliente_razon_social, //BODY
                              oficina_origen_codigo: usuario.oficina_codigo,
                              caja_codigo: tokenDecodificado.idc,
                              fecha_trabajo: caja.fecha_trabajo,
                              cuenta_codigo: req.body.cuenta_codigo, ///?????										//BODY
                              codigo_validador: req.body.codigo_validador, //??									//BODY
                              concepto: "Cambio moneda: " + req.body.accion, ////??																//BODY
                              tipo_cambio: req.body.tipo_cambio, //BODY
                              moneda1_Ingre: req.body.accion === "VENTA" ? req.body.importe_soles : 0, //???suma de valores?????? //BODY
                              moneda1_Egre: req.body.accion === "COMPRA" ? req.body.importe_soles : 0, //?suma de valores??????			//BODY
                              moneda2_Ingre: req.body.accion === "COMPRA" ? req.body.importe_dolares : 0,
                              moneda2_Egre: req.body.accion === "VENTA" ? req.body.importe_dolares : 0,
                              moneda3_Ingre: 0,
                              moneda3_Egre: 0,
                              modulo: "Tipo cambio",
                              usuario: tokenDecodificado.id,
                              estado_registro: 2
                            },
                            {
                              transaction: t
                            }
                          );
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
                res.status(412).send(err);
                // Transaction has been rolled back
                // err is whatever rejected the promise chain returned to the transaction callback
              });
          })
          .catch(err => {
            logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
            res.status(412).send(err.message);
          });
      });
    });
  });
};

exports.crearVentaMaterial = (req, res) => {
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
        const hoy = new Date();
        const yyyy = hoy.getFullYear();
        const mm = ("0" + (hoy.getMonth() + 1)).slice(-2);
        const dd = ("0" + hoy.getDate()).slice(-2);
        const fechaHoy = `${yyyy}-${mm}-${dd}`;
        getSaldoCaja(fechaHoy, tokenDecodificado.idc)
          .then(saldos => {
            if (req.body.accion === "VENTA") {
              if (parseFloat(req.body.importe_otros) > saldos.saldo3) {
                logger.log("warn", { ubicacion: filename, token: token, message: "No tiene monedas suficientes en caja" });
                throw new Error("No tiene monedas suficientes en caja");
              }
            } else if (req.body.accion === "COMPRA") {
              if (parseFloat(req.body.importe_soles) > saldos.saldo1) {
                logger.log("warn", { ubicacion: filename, token: token, message: "No tiene soles suficientes en caja" });
                throw new Error("No tiene soles suficientes en caja");
              }
            } else {
              logger.log("warn", { ubicacion: filename, token: token, message: "Opcion de tipo de cambio no especificada" });
              throw new Error("No se pueden obtener los saldos");
            }

            return models.sequelize
              .transaction(
                {
                  isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
                },
                t => {
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
                          return models.operacion_caja.create(
                            {
                              documento_codigo: req.body.documento_codigo, //BODY
                              documento_serie: req.body.documento_serie, //BODY
                              nro_operacion: nro_operacion + 1,
                              nro_transaccion: nro_operacion + 1,
                              nro_transaccion_dia: nro_operacion_dia + 1,
                              fecha_hora_operacion: Date.now(),
                              cliente_razon_social: req.body.cliente_razon_social, //BODY
                              oficina_origen_codigo: usuario.oficina_codigo,
                              caja_codigo: tokenDecodificado.idc,
                              fecha_trabajo: caja.fecha_trabajo,
                              cuenta_codigo: req.body.cuenta_codigo, ///?????										//BODY
                              codigo_validador: req.body.codigo_validador, //??									//BODY
                              concepto: req.body.valor + ": " + req.body.accion, ////------?????????																//BODY
                              tipo_cambio: req.body.tipo_cambio, //BODY
                              moneda1_Ingre: req.body.accion === "VENTA" ? req.body.importe_soles : 0, //???suma de valores?????? //BODY
                              moneda1_Egre: req.body.accion === "COMPRA" ? req.body.importe_soles : 0, //?suma de valores??????			//BODY
                              moneda2_Ingre: 0,
                              moneda2_Egre: 0,
                              moneda3_Ingre: req.body.accion === "COMPRA" ? req.body.importe_otros : 0,
                              moneda3_Egre: req.body.accion === "VENTA" ? req.body.importe_otros : 0,
                              modulo: "Materiales", //---------------------?????????????????
                              usuario: tokenDecodificado.id,
                              estado_registro: 2
                            },
                            {
                              transaction: t
                            }
                          );
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
                res.status(412).send(err);
                console.log(err)
                // Transaction has been rolled back
                // err is whatever rejected the promise chain returned to the transaction callback
              });
          })
          .catch(err => {
            logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
            res.status(412).send(err.message);
            console.log(err)
          });
      });
    });
  });
};

exports.buscarOperacioncaja = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      models.operacion_caja
        .findOne({
          attributes: [
            "documento_codigo",
            "documento_serie",
            "nro_operacion",
            "fecha_hora_operacion",
            "id_cliente",
            "concepto",
            "cliente_razon_social",
            "oficina_origen_codigo",
            "fecha_trabajo",
            "caja_codigo",
            "tipo_cambio",
            "cuenta_codigo",
            "moneda1_Ingre",
            "moneda1_Egre",
            "moneda2_Ingre",
            "moneda2_Egre",
            "createdAt"
          ],
          where: {
            fecha_trabajo: Date.now(),
            oficina_origen_codigo: usuario.oficina_codigo,
            documento_codigo: req.params.documento_codigo,
            documento_serie: req.params.documento_serie,
            nro_operacion: req.params.nro_operacion
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
    });
  });
};

exports.listarOperacionesDia = async (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  const tiempo = await models.configuracion.findOne({
    where: {
      clave: "Tiempo_Maximo_Pago_Autorizacion_Dias"
    }
  });

  if (tiempo == null) {
    res.status(409).send("No existe la variable tiempo de busqueda");
    return;
  }

  const fechaHoy = moment()
    .subtract(parseInt(tiempo), "days")
    .format();

  let query = {};
  try {
    const nroop = parseInt(req.params.nombre_cliente);
    if (nroop > 0) {
      query = {
        [Op.or]: [
          { cliente_razon_social: { [Op.iLike]: `%${req.params.nombre_cliente}%` } },
          { nro_operacion: req.params.nombre_cliente },
          { modulo: { [Op.iLike]: `%${req.params.nombre_cliente}%` } }
        ]
      };
    } else {
      query = {
        [Op.or]: [
          { cliente_razon_social: { [Op.iLike]: `%${req.params.nombre_cliente}%` } },
          { modulo: { [Op.iLike]: `%${req.params.nombre_cliente}%` } }
        ]
      };
    }
  } catch (error) {
    query = {
      [Op.or]: [
        { cliente_razon_social: { [Op.iLike]: `%${req.params.nombre_cliente}%` } },
        { modulo: { [Op.iLike]: `%${req.params.nombre_cliente}%` } }
      ]
    };
  }

  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      models.operacion_caja
        .findAndCountAll({
          where: {
            caja_codigo: usuario.caja_codigo,
            //fecha_trabajo: { [Op.gte]: fechaHoy },
            //usuario: tokenDecodificado.id,
            ...query
          },
          offset: req.params.cantidad * (req.params.pagina - 1),
          limit: req.params.cantidad,
          order: [["fecha_hora_operacion", "DESC"]]
        })
        .then(operaciones => {
          res.json(operaciones);
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
          res.status(409).send(err.message);
        });
    });
  });
};

exports.listarUltimasOperaciones = async (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  const tiempo = await models.configuracion.findOne({
    where: {
      clave: "Tiempo_Maximo_Pago_Autorizacion_Dias"
    }
  });

  if (tiempo == null) {
    res.status(409).send("No existe la variable tiempo de busqueda");
    return;
  }

  const fechaHoy = moment()
    .subtract(parseInt(tiempo), "days")
    .format();

  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      models.operacion_caja
        .findAll({
          where: {
            caja_codigo: usuario.caja_codigo
            //fecha_trabajo: { [Op.gte]: fechaHoy },
            //usuario: tokenDecodificado.id,
          },
          limit: req.params.cantidad,
          order: [["fecha_hora_operacion", "DESC"]]
        })
        .then(operaciones => {
          res.json({ rows: operaciones, count: req.params.cantidad });
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
          res.status(409).send(err.message);
        });
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
