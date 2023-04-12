const Sequelize = require("sequelize");
const models = require("../models");
const utils = require("../services/utils");
const moment = require("moment");
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.crearServicio = (req, res) => {
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  var logger = req.app.get("winston");
  var socket = req.app.get("socketio");
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
            t => {
              caja = JSON.parse(caja);
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
                    .then(async nro_operacion_dia => {
                      const cuenta_corriente = await models.cuenta_corriente.findOne({
                        where: {
                          id_cuenta: req.body.id_cuenta_tercera,
                          oficina_codigo_src: usuario.oficina_codigo,
                          estado_registro: true,
                          es_servicio: true
                        }
                      });

                      if (cuenta_corriente == null) {
                        throw new Error("Cuenta corriente inválida");
                      }

                      const entidad_financiera = await models.entidad_financiera_servicios.findOne({
                        where: {
                          entidad_codigo: req.body.entidad_codigo
                        }
                      });

                      if (entidad_financiera == null) {
                        throw new Error("Servicio no existe");
                      } else {
                        if (entidad_financiera.cuenta_codigo == null) {
                          throw new Error("El servicio no esta asociado con una cuenta contable");
                        }
                      }

                      if (cuenta_corriente.tipo_cta == "DEBITO") {
                        const saldo = await getSaldoCuentaCorriente(req.body.id_cuenta_tercera);
                        if (saldo < parseFloat(req.body.importe)) {
                          throw new Error("Su cuenta no cuenta con saldo suficiente");
                        }
                      }

                      /*************************************************************/

                      return models.operacion_caja
                        .create(
                          {
                            documento_codigo: req.body.documento_codigo, //BODY
                            documento_serie: req.body.documento_serie, //BODY
                            nro_operacion: nro_operacion + 1,
                            nro_transaccion: nro_operacion + 1,
                            nro_transaccion_dia: nro_operacion_dia + 1,
                            fecha_hora_operacion: Date.now(),
                            cliente_razon_social: req.body.razon_social, //BODY
                            oficina_origen_codigo: usuario.oficina_codigo,
                            caja_codigo: tokenDecodificado.idc,
                            fecha_trabajo: caja.fecha_trabajo,
                            concepto: `${req.body.solicitud_obs}`, ////??																//BODY
                            tipo_cambio: 0, //BODY
                            moneda1_Ingre:
                              req.body.moneda == 1 ? parseFloat(req.body.importe) + (req.body.comision ? parseFloat(req.body.comision) : 0) : 0, //???suma de valores?????? //BODY
                            moneda1_Egre: 0, //?suma de valores??????			//BODY
                            moneda2_Ingre:
                              req.body.moneda == 2 ? parseFloat(req.body.importe) + (req.body.comision ? parseFloat(req.body.comision) : 0) : 0,
                            moneda2_Egre: 0,
                            moneda3_Ingre: 0,
                            moneda3_Egre: 0,
                            modulo: req.body.tipo_giro,
                            usuario: tokenDecodificado.id,
                            estado_registro: 1
                          },
                          {
                            transaction: t
                          }
                        )
                        .then(op_Caja => {
                          return models.operacion_cuenta.create(
                            {
                              documento_codigo: op_Caja.documento_codigo,
                              documento_serie: op_Caja.documento_serie,
                              nro_operacion: op_Caja.nro_operacion,
                              recibo_tipo: "EGRESO",
                              moneda: 1,
                              codigo_insumo: req.body.codigo_insumo,
                              razon_social: req.body.razon_social,
                              importe: req.body.importe,
                              comision: req.body.comision,
                              id_cuenta_tercera: cuenta_corriente.id_cuenta,
                              entidad_codigo: req.body.entidad_codigo,
                              cuenta_codigo: entidad_financiera.cuenta_codigo,
                              cuenta_nro_operacion: req.body.cuenta_nro_operacion
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
            NotificacionIngreso(
              redis,
              socket,
              "SERVICIO",
              result.importe,
              `Pago de servicios por un monto de ${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(result.importe)}`,
              "",
              `${result.documento_codigo}${result.documento_serie}-${result.nro_operacion}`,
              tokenDecodificado.id
            );
            res.json(result);
            // Transaction has been committed
            // result is whatever the result of the promise chain returned to the transaction callback
          })
          .catch(err => {
            logger.log("error", {
              ubicacion: filename,
              token: token,
              message: { mensaje: err.message, tracestack: err.stack }
            });
            res.status(409).send(err.message);
            // Transaction has been rolled back
            // err is whatever rejected the promise chain returned to the transaction callback
          });
      });
    });
  });
};

exports.egresoCuentaServicio = (req, res) => {
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  var logger = req.app.get("winston");
  var socket = req.app.get("socketio");

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
                if (req.body.moneda == 1) {
                  if (saldos.saldo1 < req.body.importe && caja.verificar_saldo_caja == "VERIFICAR") {
                    throw new Error("Su caja no cuenta con saldo suficiente");
                  }
                } else if (req.body.moneda == 2) {
                  if (saldos.saldo2 < req.body.importe && caja.verificar_saldo_caja == "VERIFICAR") {
                    throw new Error("Su caja no cuenta con saldo suficiente");
                  }
                } else {
                  throw new Error("Moneda no reconocida");
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
                    .then(async nro_operacion_dia => {
                      const cuenta_corriente = await models.cuenta_corriente.findOne({
                        where: {
                          id_cuenta: req.body.id_cuenta_tercera,
                          oficina_codigo_src: usuario.oficina_codigo,
                          estado_registro: true,
                          es_servicio: true
                        }
                      });

                      if (cuenta_corriente == null) {
                        throw new Error("Cuenta corriente inválida");
                      }

                      const Cuenta_Contable_Servicios = await models.configuracion.findOne({
                        where: {
                          clave: "Cuenta_Contable_Servicios"
                        }
                      });
                      let cuenta = null;
                      if (Cuenta_Contable_Servicios == null) {
                        throw new Error("No existe el valor de la variable 'Cuenta Contable Servicios'");
                      } else {
                        cuenta = await models.cuenta.findOne({
                          where: {
                            cuenta_codigo: Cuenta_Contable_Servicios.valor
                          }
                        });
                        if (cuenta == null) {
                          throw new Error("La cuenta contable no existe");
                        }
                      }

                      /*************************************************************/

                      return models.operacion_caja
                        .create(
                          {
                            documento_codigo: req.body.documento_codigo, //BODY
                            documento_serie: req.body.documento_serie, //BODY
                            nro_operacion: nro_operacion + 1,
                            nro_transaccion: nro_operacion + 1,
                            nro_transaccion_dia: nro_operacion_dia + 1,
                            fecha_hora_operacion: Date.now(),
                            cliente_razon_social: req.body.razon_social, //BODY
                            oficina_origen_codigo: usuario.oficina_codigo,
                            caja_codigo: tokenDecodificado.idc,
                            fecha_trabajo: caja.fecha_trabajo,
                            concepto: `${req.body.solicitud_obs}`, ////??																//BODY
                            tipo_cambio: 0, //BODY
                            moneda1_Ingre: 0,
                            moneda1_Egre: req.body.moneda == 1 ? parseFloat(req.body.importe) : 0,
                            moneda2_Ingre: 0,
                            moneda2_Egre: req.body.moneda == 2 ? parseFloat(req.body.importe) : 0,
                            moneda3_Ingre: 0,
                            moneda3_Egre: 0,
                            modulo: "Egreso Servicios",
                            usuario: tokenDecodificado.id,
                            estado_registro: 1
                          },
                          {
                            transaction: t
                          }
                        )
                        .then(op_Caja => {
                          return models.operacion_cuenta.create(
                            {
                              documento_codigo: op_Caja.documento_codigo,
                              documento_serie: op_Caja.documento_serie,
                              nro_operacion: op_Caja.nro_operacion,
                              recibo_tipo: "INGRESO",
                              codigo_insumo: req.body.codigo_insumo,
                              razon_social: req.body.razon_social,
                              importe: req.body.importe,
                              comision: req.body.comision,
                              id_cuenta_tercera: cuenta_corriente.id_cuenta,
                              entidad_codigo: req.body.entidad_codigo,
                              cuenta_codigo: cuenta.cuenta_codigo,
                              cuenta_nro_operacion: req.body.cuenta_nro_operacion
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
            NotificacionEgreso(
              redis,
              socket,
              "SERVICIO",
              result.importe,
              `Egreso cuenta servicios por un monto de ${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(result.importe)}`,
              "",
              `${result.documento_codigo}${result.documento_serie}-${result.nro_operacion}`,
              tokenDecodificado.id
            );
            res.json(result);
            // Transaction has been committed
            // result is whatever the result of the promise chain returned to the transaction callback
          })
          .catch(err => {
            logger.log("error", {
              ubicacion: filename,
              token: token,
              message: { mensaje: err.message, tracestack: err.stack }
            });
            res.status(409).send(err.message);
            // Transaction has been rolled back
            // err is whatever rejected the promise chain returned to the transaction callback
          });
      });
    });
  });
};

exports.retiroCuenta = (req, res) => {
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  var logger = req.app.get("winston");
  var socket = req.app.get("socketio");
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
            t => {
              caja = JSON.parse(caja);
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
                    .then(async nro_operacion_dia => {
                      const cuenta_corriente = await models.cuenta_corriente.findOne({
                        where: {
                          id_cuenta: req.body.id_cuenta_tercera,
                          oficina_codigo_src: usuario.oficina_codigo,
                          estado_registro: true,
                          es_servicio: false
                        }
                      });

                      if (cuenta_corriente == null) {
                        throw new Error("Cuenta corriente inválida");
                      }

                      const entidad_financiera = await models.entidad_financiera_servicios.findOne({
                        where: {
                          entidad_codigo: cuenta_corriente.entidad_codigo
                        }
                      });

                      if (entidad_financiera == null) {
                        throw new Error("Servicio no existe");
                      } else {
                        if (entidad_financiera.cuenta_codigo == null) {
                          throw new Error("El servicio no esta asociado con una cuenta contable");
                        }
                      }

                      if (cuenta_corriente.tipo_cta == "DEBITO") {
                        const saldo = await getSaldoCuentaCorrienteClientes(req.body.id_cuenta_tercera);
                        const moneda = parseInt(req.body.moneda);
                        if (moneda == 1) {
                          if (saldo.saldoSoles.toFixed(2) < parseFloat(req.body.importe) + parseFloat(req.body.comision)) {
                            throw new Error(`Cliente cuenta con S/. ${saldo.saldoSoles.toFixed(2)} de saldo en su cuenta`);
                          }
                        } else if (moneda == 2) {
                          if (saldo.saldoDolares.toFixed(2) < parseFloat(req.body.importe) + parseFloat(req.body.comision)) {
                            throw new Error(`Cliente cuenta con $. ${saldo.saldoDolares.toFixed(2)} de saldo en su cuenta`);
                          }
                        } else {
                          throw new Error("No existe esa moneda");
                        }
                      } else if (cuenta_corriente.tipo_cta == "CREDITO") {
                        const saldo = await getSaldoCuentaCorrienteClientes(req.body.id_cuenta_tercera);
                        const moneda = parseInt(req.body.moneda);
                        if (moneda == 1) {
                          if (
                            parseFloat(saldo.saldoSoles) + parseFloat(cuenta_corriente.credito_maximo_soles) <
                            parseFloat(req.body.importe) + parseFloat(req.body.comision)
                          ) {
                            throw new Error(`El importe de retiro excede el crédito máximo del cliente`);
                          }
                        } else if (moneda == 2) {
                          if (
                            parseFloat(saldo.saldoDolares) + parseFloat(cuenta_corriente.credito_maximo_dolares) <
                            parseFloat(req.body.importe) + parseFloat(req.body.comision)
                          ) {
                            throw new Error(`El importe de retiro excede el crédito máximo del cliente`);
                          }
                        } else {
                          throw new Error("No existe esa moneda");
                        }
                      } else {
                        throw new Error("Tipo de cuenta desconocida");
                      }

                      /*************************************************************/

                      return models.operacion_caja
                        .create(
                          {
                            documento_codigo: req.body.documento_codigo, //BODY
                            documento_serie: req.body.documento_serie, //BODY
                            nro_operacion: nro_operacion + 1,
                            nro_transaccion: nro_operacion + 1,
                            nro_transaccion_dia: nro_operacion_dia + 1,
                            fecha_hora_operacion: Date.now(),
                            cliente_razon_social: req.body.razon_social, //BODY
                            oficina_origen_codigo: usuario.oficina_codigo,
                            caja_codigo: tokenDecodificado.idc,
                            fecha_trabajo: caja.fecha_trabajo,
                            concepto: `${req.body.solicitud_obs}`, ////??																//BODY
                            tipo_cambio: 0, //BODY
                            moneda1_Ingre: 0,
                            moneda1_Egre: req.body.moneda == 1 ? parseFloat(req.body.importe) : 0,
                            moneda2_Ingre: 0,
                            moneda2_Egre: req.body.moneda == 2 ? parseFloat(req.body.importe) : 0,
                            moneda3_Ingre: 0,
                            moneda3_Egre: 0,
                            modulo: "Retiro cuenta",
                            usuario: tokenDecodificado.id,
                            estado_registro: 1
                          },
                          {
                            transaction: t
                          }
                        )
                        .then(op_Caja => {
                          return models.operacion_cuenta.create(
                            {
                              documento_codigo: op_Caja.documento_codigo,
                              documento_serie: op_Caja.documento_serie,
                              nro_operacion: op_Caja.nro_operacion,
                              recibo_tipo: "EGRESO",
                              moneda: parseInt(req.body.moneda),
                              codigo_insumo: req.body.codigo_insumo,
                              razon_social: req.body.razon_social,
                              importe: req.body.importe,
                              comision: req.body.comision,
                              id_cuenta_tercera: cuenta_corriente.id_cuenta,
                              entidad_codigo: cuenta_corriente.entidad_codigo,
                              cuenta_codigo: entidad_financiera.cuenta_codigo,
                              cuenta_nro_operacion: req.body.cuenta_nro_operacion
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
            NotificacionEgreso(
              redis,
              socket,
              "SERVICIO",
              result.importe,
              `Retiro de cuenta corriente por un monto de ${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(result.importe)}`,
              "",
              `${result.documento_codigo}${result.documento_serie}-${result.nro_operacion}`,
              tokenDecodificado.id
            );
            res.json(result);
          })
          .catch(err => {
            logger.log("error", {
              ubicacion: filename,
              token: token,
              message: { mensaje: err.message, tracestack: err.stack }
            });
            res.status(409).send(err.message);
          });
      });
    });
  });
};

exports.depositoCuenta = (req, res) => {
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  var logger = req.app.get("winston");
  var socket = req.app.get("socketio");
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
            t => {
              caja = JSON.parse(caja);
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
                    .then(async nro_operacion_dia => {
                      const cuenta_corriente = await models.cuenta_corriente.findOne({
                        where: {
                          id_cuenta: req.body.id_cuenta_tercera,
                          oficina_codigo_src: usuario.oficina_codigo,
                          estado_registro: true,
                          es_servicio: false
                        }
                      });

                      if (cuenta_corriente == null) {
                        throw new Error("Cuenta corriente inválida");
                      }

                      const entidad_financiera = await models.entidad_financiera_servicios.findOne({
                        where: {
                          entidad_codigo: cuenta_corriente.entidad_codigo
                        }
                      });

                      if (entidad_financiera == null) {
                        throw new Error("Servicio no existe");
                      } else {
                        if (entidad_financiera.cuenta_codigo == null) {
                          throw new Error("El servicio no esta asociado con una cuenta contable");
                        }
                      }

                      /*************************************************************/

                      return models.operacion_caja
                        .create(
                          {
                            documento_codigo: req.body.documento_codigo, //BODY
                            documento_serie: req.body.documento_serie, //BODY
                            nro_operacion: nro_operacion + 1,
                            nro_transaccion: nro_operacion + 1,
                            nro_transaccion_dia: nro_operacion_dia + 1,
                            fecha_hora_operacion: Date.now(),
                            cliente_razon_social: req.body.razon_social, //BODY
                            oficina_origen_codigo: usuario.oficina_codigo,
                            caja_codigo: tokenDecodificado.idc,
                            fecha_trabajo: caja.fecha_trabajo,
                            concepto: `${req.body.solicitud_obs}`, ////??																//BODY
                            tipo_cambio: 0, //BODY
                            moneda1_Ingre:
                              req.body.moneda == 1 ? parseFloat(req.body.importe) + (req.body.comision ? parseFloat(req.body.comision) : 0) : 0,
                            moneda1_Egre: 0,
                            moneda2_Ingre:
                              req.body.moneda == 2 ? parseFloat(req.body.importe) + (req.body.comision ? parseFloat(req.body.comision) : 0) : 0,
                            moneda2_Egre: 0,
                            moneda3_Ingre: 0,
                            moneda3_Egre: 0,
                            modulo: "Deposito cuenta",
                            usuario: tokenDecodificado.id,
                            estado_registro: 1
                          },
                          {
                            transaction: t
                          }
                        )
                        .then(op_Caja => {
                          return models.operacion_cuenta.create(
                            {
                              documento_codigo: op_Caja.documento_codigo,
                              documento_serie: op_Caja.documento_serie,
                              nro_operacion: op_Caja.nro_operacion,
                              recibo_tipo: "INGRESO",
                              moneda: parseInt(req.body.moneda),
                              codigo_insumo: req.body.codigo_insumo,
                              razon_social: req.body.razon_social,
                              importe: req.body.importe,
                              comision: req.body.comision,
                              id_cuenta_tercera: cuenta_corriente.id_cuenta,
                              entidad_codigo: cuenta_corriente.entidad_codigo,
                              cuenta_codigo: entidad_financiera.cuenta_codigo,
                              cuenta_nro_operacion: req.body.cuenta_nro_operacion
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
            NotificacionIngreso(
              redis,
              socket,
              "SERVICIO",
              result.importe,
              `Deposito a cuenta corriente por un monto de ${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(result.importe)}`,
              "",
              `${result.documento_codigo}${result.documento_serie}-${result.nro_operacion}`,
              tokenDecodificado.id
            );
            res.json(result);
          })
          .catch(err => {
            logger.log("error", {
              ubicacion: filename,
              token: token,
              message: { mensaje: err.message, tracestack: err.stack }
            });
            res.status(409).send(err.message);
          });
      });
    });
  });
};

exports.nroSiguienteOperacion = function(req, res, next) {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  models.operacion_caja
    .findAll({
      limit: 1,
      where: {
        documento_codigo: req.params.documento_codigo,
        documento_serie: req.params.documento_serie
      },
      order: [["nro_operacion", "DESC"]]
    })
    .then(async opsCaja => {
      let nro_operacion;
      if (opsCaja.length === 0) {
        const docSerie = await models.documento_serie.findOne({
          where: {
            documento_codigo: req.params.documento_codigo,
            documento_serie: req.params.documento_serie
          }
        });
        nro_operacion = parseInt(docSerie.nro_inicio);
      } else {
        nro_operacion = parseInt(opsCaja[0].nro_operacion) + 1;
      }
      res.json({ nro_operacion: nro_operacion });
    })
    .catch(err => {
      logger.log("error", {
        ubicacion: filename,
        token: token,
        message: { mensaje: err.message, tracestack: err.stack }
      });
      res.status(409).send("No se puede buscar el siguiente nro de operacion");
    });
};

exports.buscarOperacion = (req, res) => {
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  var logger = req.app.get("winston");

  models.sequelize
    .query(`select * from buscar_op_cuenta(:documento_codigo, :documento_serie, :nro_operacion)`, {
      replacements: {
        documento_codigo: req.params.documento_codigo,
        documento_serie: req.params.documento_serie,
        nro_operacion: req.params.nro_operacion
      },
      type: models.sequelize.QueryTypes.SELECT,
      nest: true
    })
    .then(operacion_cuenta => {
      operacion_cuenta = operacion_cuenta[0];
      res.json(operacion_cuenta);
    })
    .catch(err => {
      logger.log("error", {
        ubicacion: filename,
        token: token,
        message: { mensaje: err.message, tracestack: err.stack }
      });
      res.status(409).send("No se encuentra");
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

function getSaldoCuentaCorriente(id_cuenta) {
  return new Promise((resolve, reject) => {
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
        resolve(ingresos - egresos);
      })
      .catch(err => {
        reject(err);
      });
  });
}

function getSaldoCuentaCorrienteClientes(id_cuenta) {
  return new Promise((resolve, reject) => {
    models.sequelize
      .query(`select * from saldos_cuenta_clientes(:id_cuenta);`, {
        replacements: {
          id_cuenta: id_cuenta
        },
        type: models.sequelize.QueryTypes.SELECT,
        nest: true
      })
      .then(saldos => {
        if (saldos) {
          const saldoSoles = saldos[0].depositosoles - saldos[0].retirosoles;
          const saldoDolares = saldos[0].depositodolares - saldos[0].retirodolares;
          resolve({ saldoSoles, saldoDolares });
        } else {
          reject("No existe cuenta");
        }
      })
      .catch(err => {
        reject(err);
      });
  });
}

function NotificacionIngreso(redis, socket, tipo, importe, texto1, texto2, texto3, usuario) {
  redis.get("Notificacion_Monto_Ingreso", async (err, monto) => {
    let monto_maximo_ingreso = 999999999;
    if (monto) {
      monto_maximo_ingreso = monto;
    } else {
      const montoIngreso = await models.configuracion.findOne({
        where: {
          clave: "Notificacion_Monto_Ingreso"
        }
      });
      redis.set("Notificacion_Monto_Ingreso", parseFloat(montoIngreso.valor));
      monto_maximo_ingreso = parseFloat(montoIngreso.valor);
    }

    if (parseFloat(importe) >= monto_maximo_ingreso) {
      //BUSCAR USUARIOS QUE TIENEN ACCESO A NOTIFICACIONES ADMINISTRADOR
      models.cuenta_usuario
        .findAll({
          attributes: ["usuario"],
          where: {
            "$perfil->lista_menus.menu_codigo$": "r21",
            "$perfil->lista_menus.nivel_acceso$":{[Op.gte]: 1},
            estado_registro: true
          },
          include: [
            {
              model: models.perfil,
              required: false,
              attributes: ["perfil_codigo"],
              include: [
                {
                  model: models.lista_menu,
                  required: false
                }
              ]
            }
          ]
        })
        .then(async usuarios => {
          models.notificacion
            .create({
              fecha_registro: Date.now(),
              texto1: texto1,
              texto2: texto2,
              texto3: texto3,
              usuario_registro: usuario,
              tipo: tipo
            })
            .then(notif => {
              usuarios.forEach(user => {
                models.usuario_notificacion.create({
                  id_usuario: user.usuario,
                  id_notificacion: notif.id,
                  leido: false
                });
                socket.emit(user.usuario + "notificaciones", {
                  fecha_registro: Date.now(),
                  texto1: texto1,
                  texto2: texto2,
                  texto3: texto3,
                  usuario_registro: usuario,
                  tipo: tipo,
                  leido: false
                });
              });
            });
        });
    }
  });
}

function NotificacionEgreso(redis, socket, tipo, importe, texto1, texto2, texto3, usuario) {
  redis.get("Notificacion_Monto_Egreso", async (err, monto) => {
    let monto_maximo_egreso = 999999999;
    if (monto) {
      monto_maximo_egreso = monto;
    } else {
      const montoEgreso = await models.configuracion.findOne({
        where: {
          clave: "Notificacion_Monto_Egreso"
        }
      });
      redis.set("Notificacion_Monto_Egreso", parseFloat(montoEgreso.valor));
      monto_maximo_egreso = parseFloat(montoEgreso.valor);
    }

    if (parseFloat(importe) >= monto_maximo_egreso) {
      //BUSCAR USUARIOS QUE TIENEN ACCESO A NOTIFICACIONES ADMINISTRADOR
      models.cuenta_usuario
        .findAll({
          attributes: ["usuario"],
          where: {
            "$perfil->lista_menus.menu_codigo$": "r21",
            "$perfil->lista_menus.nivel_acceso$":{[Op.gte]: 1},
            estado_registro: true
          },
          include: [
            {
              model: models.perfil,
              required: false,
              attributes: ["perfil_codigo"],
              include: [
                {
                  model: models.lista_menu,
                  required: false
                }
              ]
            }
          ]
        })
        .then(async usuarios => {
          models.notificacion
            .create({
              fecha_registro: Date.now(),
              texto1: texto1,
              texto2: texto2,
              texto3: texto3,
              usuario_registro: usuario,
              tipo: tipo
            })
            .then(notif => {
              usuarios.forEach(user => {
                models.usuario_notificacion.create({
                  id_usuario: user.usuario,
                  id_notificacion: notif.id,
                  leido: false
                });
                socket.emit(user.usuario + "notificaciones", {
                  fecha_registro: Date.now(),
                  texto1: texto1,
                  texto2: texto2,
                  texto3: texto3,
                  usuario_registro: usuario,
                  tipo: tipo,
                  leido: false
                });
              });
            });
        });
    }
  });
}
