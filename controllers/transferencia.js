const Sequelize = require("sequelize");
const models = require("../models");
const utils = require("../services/utils");
const moment = require("moment");
const Op = Sequelize.Op;
const fs = require("fs");
const key = require("../config/key");
const hash = require("object-hash");
var filename = module.filename.split("/").slice(-1);

//////////////////////////////////////////////////////////////
//             GUARDAR IMAGENES EN UNA CARPETA              //
//////////////////////////////////////////////////////////////
const mkdirp = require("mkdirp");
var multer = require("multer");
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const dir = "imagenesComprobantes";
    mkdirp(dir, err => cb(err, dir));
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});
var upload = multer({ storage: storage }).single("imagen");
//////////////////////////////////////////////////////////////
//                                                          //
//////////////////////////////////////////////////////////////
/*
  exports.migrar = function(req, res, next) {
    var redis = req.app.get("redis");
    var logger = req.app.get("winston");
    //const token = req.header("Authorization").split(" ")[1];

    let rawdata = fs.readFileSync("listaGirosProcesados.json");
    let jsonGiros = JSON.parse(rawdata);
    var arrcreate = jsonGiros.map(giro => {
      return models.sequelize
        .transaction(
          {
            isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
          },
          t => {
            //INICIA TRANSACCION
            return models.operacion_caja
              .findAll({
                limit: 1,
                where: {
                  documento_codigo: giro.documento_codigo,
                  documento_serie: giro.documento_serie
                },
                order: [["nro_operacion", "DESC"]],
                transaction: t,
                lock: t.LOCK.UPDATE
              })
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
                    
                    const cliente = await models.cliente_proveedor.findByPk(giro.beneficiario_docident);
                    let id_cliente = {};
                    if (cliente !== null) {
                      id_cliente = {
                        id_cliente: giro.beneficiario_docident
                      };
                    }
                    

                    return models.operacion_caja
                      .create(
                        {
                          documento_codigo: giro.documento_codigo, //BODY
                          documento_serie: giro.documento_serie, //BODY
                          nro_operacion: nro_operacion + 1,
                          nro_transaccion: nro_operacion + 1,
                          nro_transaccion_dia: nro_operacion_dia + 1,
                          fecha_hora_operacion: Date.now(),
                          ...id_cliente,
                          cliente_razon_social: giro.beneficiario_razon_social, //BODY
                          oficina_origen_codigo: giro.oficina_codigo_origen,
                          cuenta_codigo: giro.cuenta_codigo, ///?????										//BODY
                          codigo_validador: giro.codigo_validador, //??									//BODY
                          concepto: giro.concepto, ////??																//BODY
                          tipo_cambio: 0, //BODY
                          moneda1_Ingre:
                            giro.moneda == 1
                              ? parseFloat(giro.comision_dt) + parseFloat(giro.importe) + (giro.comision_banco ? parseFloat(giro.comision_banco) : 0)
                              : 0, //???suma de valores?????? //BODY
                          moneda1_Egre: 0, //?suma de valores??????			//BODY
                          moneda2_Ingre:
                            giro.moneda == 2
                              ? parseFloat(giro.comision_dt) + parseFloat(giro.importe) + (giro.comision_banco ? parseFloat(giro.comision_banco) : 0)
                              : 0,
                          moneda2_Egre: 0,
                          moneda3_Ingre: 0,
                          moneda3_Egre: 0,
                          modulo: giro.tipo_giro
                        },
                        {
                          transaction: t
                        }
                      )
                      .then(op_Caja => {
                        return models.transferencia.create(
                          {
                            St_documento_codigo: op_Caja.documento_codigo,
                            St_documento_serie: op_Caja.documento_serie,
                            nro_Solicitud: op_Caja.nro_operacion,
                            oficina_codigo_origen: op_Caja.oficina_origen_codigo,
                            oficina_codigo_destino: giro.oficina_codigo_destino,
                            solicitud_fecha_hora: Date.now(),
                            beneficiario_id_cliente: giro.beneficiario_id_cliente,
                            beneficiario_razon_social: giro.beneficiario_razon_social,
                            beneficiario_docident: giro.beneficiario_docident,
                            beneficiario_otros_datos: giro.beneficiario_otros_datos,
                            solicitante_id_cliente: giro.solicitante_id_cliente,
                            solicitante_razon_social: giro.solicitante_razon_social,
                            solicitante_otros_datos: giro.solicitante_otros_datos,
                            moneda: giro.moneda,
                            importe: giro.importe,
                            comision_dt: giro.comision_dt,
                            comision_banco: giro.comision_banco,
                            deposito_entidad_codigo: giro.deposito_entidad_codigo,
                            deposito_nro_cuenta: giro.deposito_nro_cuenta,
                            deposito_tipo: giro.deposito_tipo,
                            deposito_destino: giro.deposito_destino,
                            beneficiario_nro_celular: giro.beneficiario_nro_celular,
                            solicitante_nro_celular: giro.solicitante_nro_celular,

                            solicitud_obs: giro.solicitud_obs,
                            solicitud_msj: giro.solicitud_msj,
                            autorizacion_fecha_hora: giro.autorizacion_fecha_hora,
                            autorizacion_usuario: giro.autorizacion_usuario,
                            st_autorizada: giro.st_autorizada,
                            st_estado: 1
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
        .then(p => {
          res.status(200).send("Realizado");
        });
    });

    
    Promise.all(arrcreate)
      .then(resp => {
        res.json("Migrado!!");
      })
      .catch(err => {
        logger.log("error", { ubicacion: filename, token: token, message : err.message });
        res.status(409).send(err);
      });

  };
*/
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

exports.nroSiguienteOperacionOficina = function(req, res, next) {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  models.documento_serie
    .findAll({
      limit: 1,
      where: {
        oficina_codigo: req.params.oficina_codigo,
        documento_codigo: "RG-"
      }
    })
    .then(documento_serie => {
      models.operacion_caja
        .findAll({
          limit: 1,
          where: {
            oficina_origen_codigo: req.params.oficina_codigo,
            documento_codigo: "RG-",
            documento_serie: documento_serie[0].documento_serie
          },
          order: [["nro_operacion", "DESC"]]
        })
        .then(async opsCaja => {
          if (opsCaja.length > 0) {
            let nro_operacion = parseInt(opsCaja[0].nro_operacion) + 1;
            res.json({ nro_operacion: nro_operacion });
          } else {
            res.json({ nro_operacion: 1 });
          }
        })
        .catch(err => {
          logger.log("error", {
            ubicacion: filename,
            token: token,
            message: { mensaje: err.message, tracestack: err.stack }
          });
          res.status(409).send("No se puede buscar el siguiente nro de operacion");
        });
    })
    .catch(err => {
      logger.log("error", {
        ubicacion: filename,
        token: token,
        message: { mensaje: err.message, tracestack: err.stack }
      });
      res.status(409).send("No se puede buscar el nro de serie");
    });
  
};

exports.crear = function(req, res, next) {
  var redis = req.app.get("redis");
  var socket = req.app.get("socketio");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    crearTransferencia(req)
      .then(resp => {
        let oficina_origen;
        let oficina_destino;
        models.sequelize
        .query(
          `select ofio.oficina_nombre as origen, ofid.oficina_nombre as destino
          from transferencia t left join oficina ofio on (t.oficina_codigo_origen = ofio.oficina_codigo) left join oficina ofid on (t.oficina_codigo_destino = ofid.oficina_codigo)
          where t."St_documento_codigo" = '${resp.St_documento_codigo}' and t."St_documento_serie" = ${resp.St_documento_serie} and t."nro_Solicitud" = ${resp.nro_Solicitud}`,
          {
          type: models.sequelize.QueryTypes.SELECT
          }
        )
        .then(respuesta => {
          oficina_origen = respuesta[0].origen
          oficina_destino = respuesta[0].destino
          NotificacionIngreso(
            redis,
            socket,
            "GIRO",
            req.body.importe,
            `Giro registrado por un monto de ${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(req.body.importe)}`,
            `Origen: ${oficina_origen} Destino: ${oficina_destino}`,
            `${resp.St_documento_codigo}${resp.St_documento_serie}-${resp.nro_Solicitud}`,
            tokenDecodificado.id
          );
        });
        
        res.json(resp);
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
};

exports.cancelar = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  var socket = req.app.get("socketio");
  const token = req.header("Authorization").split(" ")[1];

  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      //OBTENER DATOS DE CAJA DESDE REDIS
      redis.get(tokenDecodificado.idc, (err, caja) => {
        //INICIA TRANSACCION
        let opCaja = null;
        let transf = null;
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
                    return models.transferencia
                      .findOne({
                        where: {
                          St_documento_codigo: req.body.St_documento_codigo,
                          St_documento_serie: req.body.St_documento_serie,
                          nro_Solicitud: req.body.nro_Solicitud
                        },
                        lock: t.LOCK.UPDATE,
                        transaction: t
                      })
                      .then(async transferencia => {
                        transf = transferencia;
                        //verificar saldo de caja
                        const hoy = new Date();
                        const yyyy = hoy.getFullYear();
                        const mm = ("0" + (hoy.getMonth() + 1)).slice(-2);
                        const dd = ("0" + hoy.getDate()).slice(-2);
                        const fechaHoy = `${yyyy}-${mm}-${dd}`;
                        await getSaldoCaja(fechaHoy, tokenDecodificado.idc).then(saldos => {
                          //si caja no cuenta con saldo suficiente botar error
                          if (saldos.saldo1 < transferencia.importe && caja.verificar_saldo_caja == "VERIFICAR") {
                            throw new Error(`Su caja no cuenta con saldo suficiente.`);
                          }
                        });
                        //VERIFICAR QUE EL USUARIO PERTENEZCA A LA OFICINA DESTINO DE LA TRANSFERENCIA
                        if (usuario.oficina_codigo !== transferencia.oficina_codigo_destino) {
                          throw new Error("Este giro no corresponde a su oficina");
                        }

                        //verificar estado de la transferencia
                        if (transferencia.st_estado === 2) {
                          throw new Error("Giro se encuentra pagado");
                        } else if (transferencia.st_estado === 3) {
                          throw new Error("Giro se encuentra reembolsado");
                        } else if (transferencia.st_estado === 4) {
                          throw new Error("Giro se encuentra anulado");
                        }

                        if (transferencia.st_autorizada != 6) {
                          const tiempo_autorizacion = await models.configuracion.findOne({
                            where: {
                              clave: "Tiempo_Maximo_Pago_Autorizacion_Dias"
                            }
                          });

                          if (tiempo_autorizacion == null) {
                            throw new Error("No existe la varible tiempo pago autorizacion");
                          }

                          const fechaTransferencia = moment(transferencia.solicitud_fecha_hora);// 10/01/2020
                          const fechaInicial = moment().subtract(parseInt(tiempo_autorizacion.valor), "days"); //19/02/2020


                              //19/02/2020                // 10/01/2020
                          if (fechaInicial.isSameOrAfter(fechaTransferencia)) {
                            throw new Error("Necesita autorizacion para pagar giros despues de los " + tiempo_autorizacion.valor + " dias.");
                          }

                          const configuracion_monto = await models.configuracion.findOne({
                            where: {
                              clave: "Monto_Maximo_Pago_Autorizacion"
                            }
                          });
                          if (configuracion_monto == null) {
                            throw new Error("No existe la variable de configuracion Monto maximo pago");
                          } else {
                            if (transferencia.importe > parseFloat(configuracion_monto.valor)) {
                              throw new Error("Necesita autorizacion para pagar montos mayores a " + configuracion_monto.valor);
                            }
                          }
                        }

                        //CREAR UNA OPERACION DE CAJA
                        if (req.body.id_cliente) {
                          models.cliente_proveedor
                            .findOne({
                              where: {
                                id_cliente: req.body.id_cliente
                              }
                            })
                            .then(cliente => {
                              if (cliente === null) {
                                utils.buscarDNI(req.body.id_cliente, respuesta => {
                                  if (respuesta) {
                                    models.cliente_proveedor.create({
                                      id_cliente: req.body.id_cliente,
                                      nombres: respuesta.nombres,
                                      cliente_tipo_persona: "Natural",
                                      ap_paterno: respuesta.ap_paterno,
                                      ap_materno: respuesta.ap_materno,
                                      razon_social: `${respuesta.nombres} ${respuesta.ap_paterno} ${respuesta.ap_materno}`,
                                      fecha_nacimiento: respuesta.fecha_nacimiento,
                                      sexo: respuesta.sexo,
                                      direccion: respuesta.direccion
                                    });
                                  }
                                });
                              } else {
                                if (req.body.fecha_nacimiento || req.body.sexo) {
                                  let sexo = {};
                                  if (req.body.sexo != null && req.body.sexo != "null") {
                                    sexo = { sexo: req.body.sexo };
                                  }
                                  models.cliente_proveedor.update(
                                    {
                                      ...sexo,
                                      fecha_nacimiento: req.body.fecha_nacimiento
                                    },
                                    {
                                      where: {
                                        id_cliente: req.body.id_cliente
                                      }
                                    }
                                  );
                                }
                              }
                            });
                        } else if (req.body.fecha_nacimiento || req.body.sexo) {
                          let sexo = {};
                          if (req.body.sexo != null && req.body.sexo != "null") {
                            sexo = { sexo: req.body.sexo };
                          }
                          models.cliente_proveedor.update(
                            {
                              ...sexo,
                              fecha_nacimiento: req.body.fecha_nacimiento
                            },
                            {
                              where: {
                                id_cliente: transferencia.beneficiario_docident
                              }
                            }
                          );
                        }

                        return models.operacion_caja
                          .create(
                            {
                              documento_codigo: req.body.documento_codigo, //BODY
                              documento_serie: req.body.documento_serie, //BODY
                              nro_operacion: nro_operacion + 1,
                              nro_transaccion: nro_operacion + 1,
                              nro_transaccion_dia: nro_operacion_dia + 1,
                              fecha_hora_operacion: Date.now(),
                              cliente_razon_social: transferencia.beneficiario_razon_social, //BODY
                              oficina_origen_codigo: usuario.oficina_codigo,
                              caja_codigo: tokenDecodificado.idc,
                              fecha_trabajo: caja.fecha_trabajo,
                              cuenta_codigo: req.body.cuenta_codigo, ///?????										//BODY
                              codigo_validador: req.body.codigo_validador, //??									//BODY
                              concepto: `Pago de ${transferencia.solicitante_razon_social}`, ////??																//BODY
                              tipo_cambio: 0, //BODY
                              moneda1_Ingre: 0, //???suma de valores?????? //BODY
                              moneda1_Egre:
                                transferencia.moneda == 1
                                  ? parseFloat(transferencia.importe) + (transferencia.comision_banco ? parseFloat(transferencia.comision_banco) : 0)
                                  : 0, //?suma de valores??????			//BODY
                              moneda2_Ingre: 0,
                              moneda2_Egre:
                                transferencia.moneda == 2
                                  ? parseFloat(transferencia.importe) + (transferencia.comision_banco ? parseFloat(transferencia.comision_banco) : 0)
                                  : 0,
                              moneda3_Ingre: 0,
                              moneda3_Egre: 0,
                              modulo: "Op",
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
                            return models.transferencia.update(
                              {
                                deposito_nro_operacion: req.body.deposito_nro_operacion,
                                beneficiario_docident: transferencia.beneficiario_docident
                                  ? transferencia.beneficiario_docident
                                  : req.body.id_cliente,
                                importe_pagado: req.body.importe_pagado,
                                op_usuario: tokenDecodificado.id,
                                op_documento_codigo: op_Caja.documento_codigo,
                                op_documento_serie: op_Caja.documento_serie,
                                op_nro_operacion: op_Caja.nro_operacion,
                                op_observacion: `DNI:${req.body.id_cliente || req.body.cod_validacion} | ` + req.body.concepto,
                                op_fecha_hora: Date.now(),
                                autorizacion_estado: false,
                                st_estado: 2
                              },
                              {
                                where: {
                                  St_documento_codigo: req.body.St_documento_codigo,
                                  St_documento_serie: req.body.St_documento_serie,
                                  nro_Solicitud: req.body.nro_Solicitud
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
            let oficina_origen;
            let oficina_destino;
            models.sequelize
            .query(
              `select ofio.oficina_nombre as origen, ofid.oficina_nombre as destino
              from transferencia t left join oficina ofio on (t.oficina_codigo_origen = ofio.oficina_codigo) left join oficina ofid on (t.oficina_codigo_destino = ofid.oficina_codigo)
              where t."St_documento_codigo" = '${transf.St_documento_codigo}' and t."St_documento_serie" = ${transf.St_documento_serie} and t."nro_Solicitud" = ${transf.nro_Solicitud}`,
              {
              type: models.sequelize.QueryTypes.SELECT
              }
            )
            .then(respuesta => {
              oficina_origen = respuesta[0].origen;
              oficina_destino = respuesta[0].destino;
              NotificacionEgreso(
                redis,
                socket,
                "ORDEN PAGO",
                transf.importe,
                `Giro pagado por un monto de ${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(transf.importe)}`,
                `Origen: ${oficina_origen} Destino: ${oficina_destino}`,
                `${opCaja.documento_codigo}${opCaja.documento_serie}-${opCaja.nro_operacion}`,
                tokenDecodificado.id
              );
            });
            
            res.json({
              nro_operacion: opCaja.nro_operacion,
              op_fecha_hora: opCaja.fecha_hora_operacion
            });
            // Transaction has been committed
            // result is whatever the result of the promise chain returned to the transaction callback
          })
          .catch(err => {
            logger.log("error", {
              ubicacion: filename,
              token: token,
              message: { mensaje: err.message, tracestack: err.stack }
            });
            res.status(412).send(err.message);
            // Transaction has been rolled back
            // err is whatever rejected the promise chain returned to the transaction callback
          });
      });
    });
  });
};

exports.dictarTransferencia = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      return models.sequelize
        .transaction(t => {
          //OBTIENE EL NUMERO DE OPERACION
          return models.transferencia
            .findOne({
              where: {
                St_documento_codigo: req.body.St_documento_codigo,
                St_documento_serie: req.body.St_documento_serie,
                nro_Solicitud: req.body.nro_Solicitud
              },
              lock: t.LOCK.UPDATE,
              transaction: t
            })
            .then(transferencia => {
              if (transferencia.st_estado == 2) {
                throw new Error("Giro pagado, no se puede dictar");
              } else if (transferencia.st_estado == 3) {
                throw new Error("Giro reembolsado, no se puede dictar");
              } else if (transferencia.st_estado == 4) {
                throw new Error("Giro anulado, no se puede dictar");
              } else if (transferencia.dictado_usuario) {
                throw new Error("Giro ya fue dictado");
              }

              return models.transferencia.update(
                {
                  dictado_usuario: tokenDecodificado.id,
                  dictado_fecha_hora: Date.now()
                },
                {
                  where: {
                    St_documento_codigo: req.body.St_documento_codigo,
                    St_documento_serie: req.body.St_documento_serie,
                    nro_Solicitud: req.body.nro_Solicitud
                  },
                  transaction: t
                }
              );
            });
        })
        .then(result => {
          res.json({
            dictado_usuario: tokenDecodificado.id,
            dictado_fecha_hora: Date.now()
          });
        })
        .catch(err => {
          logger.log("error", {
            ubicacion: filename,
            token: token,
            message: { mensaje: err.message, tracestack: err.stack }
          });
          res.status(412).send(err.message);
        });
    });
  });
};

exports.autorizar = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  /**------------FALTA VALIDAR QUE COMISION_DT Y COMISION_BANCO
   * ------------SEAN VALORES MENORES O IGUALES AL VALOR DE LA TRANSFERENCIA
   */
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      //OBTENER DATOS DE CAJA DESDE REDIS
      redis.get(tokenDecodificado.idc, (err, caja) => {
        return models.sequelize
          .transaction(t => {
            caja = JSON.parse(caja);
            //OBTIENE EL NUMERO DE OPERACION
            return models.transferencia
              .findOne({
                where: {
                  St_documento_codigo: req.body.St_documento_codigo,
                  St_documento_serie: req.body.St_documento_serie,
                  nro_Solicitud: req.body.nro_Solicitud
                },
                lock: t.LOCK.UPDATE,
                transaction: t
              })
              .then(transferencia => {
                if (transferencia.st_estado == 2 ) {
                  throw new Error("Giro pagado");
                } else if (transferencia.st_estado == 3) {
                  throw new Error("Giro reembolsado, no se puede realizar ninguna operacion");
                } else if (transferencia.st_estado == 4) {
                  throw new Error("Giro anulado, no se puede realizar ninguna operacion");
                }
                //VERIFICA SI LA TRANSFERNCIA YA FUE AUTORIZADA
                /*else if (transferencia.autorizacion_estado === false){
                  if(transferencia.st_autorizada == 1) {
                    throw new Error("Transferencia ya fue autorizada para DEVOLUCION");
                  } else if (transferencia.st_autorizada == 2) {
                    throw new Error("Transferencia ya fue autorizada para REEMBOLSO");
                  } else if (transferencia.st_autorizada == 3) {
                    throw new Error("Transferencia ya fue autorizada para CAMBIO DE DESTINO");
                  } else if (transferencia.st_autorizada == 4) {
                    throw new Error("Transferencia ya fue autorizada para CAMBIO DE BENEFICIARIO");
                  } else if (transferencia.st_autorizada == 5) {
                    throw new Error("Transferencia ya fue autorizada para EXTORNO");
                  }
                }*/

                return models.transferencia.update(
                  {
                    st_autorizada: req.body.st_autorizada,
                    autorizacion_fecha_hora: Date.now(),
                    autorizacion_usuario: tokenDecodificado.id,
                    autorizacion_estado: true
                  },
                  {
                    where: {
                      St_documento_codigo: req.body.St_documento_codigo,
                      St_documento_serie: req.body.St_documento_serie,
                      nro_Solicitud: req.body.nro_Solicitud
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
            logger.log("error", {
              ubicacion: filename,
              token: token,
              message: { mensaje: err.message, tracestack: err.stack }
            });
            res.status(412).send(err.message);
          });
      });
    });
  });
};

exports.autorizarPago = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  return models.sequelize
    .transaction(t => {
      return models.transferencia
        .findOne({
          where: {
            St_documento_codigo: req.body.St_documento_codigo,
            St_documento_serie: req.body.St_documento_serie,
            nro_Solicitud: req.body.nro_Solicitud
          },
          lock: t.LOCK.UPDATE,
          transaction: t
        })
        .then(transferencia => {
          if (transferencia.st_estado == 2) {
            throw new Error("Giro se encuentra pagado");
          } else if (transferencia.st_estado == 3) {
            throw new Error("Giro se encuentra reembolsado");
          } else if (transferencia.st_estado == 4) {
            throw new Error("Giro se encuentra anulado");
          }
          return models.transferencia.update(
            {
              st_autorizada: 6,
              autorizacion_fecha_hora: Date.now(),
              autorizacion_usuario: req.body.usuario,
              autorizacion_estado: true
            },
            {
              where: {
                St_documento_codigo: req.body.St_documento_codigo,
                St_documento_serie: req.body.St_documento_serie,
                nro_Solicitud: req.body.nro_Solicitud
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
      logger.log("error", {
        ubicacion: filename,
        token: token,
        message: { mensaje: err.message, tracestack: err.stack }
      });
      res.status(412).send(err.message);
    });
};

exports.realizarAnulacion = (req, res) => {
  /**
   * TABLAS AFECTADAS:
   * -OPERACION_CAJA
   * -RECIBO_INTERNO
   * -TRANSFERENCIA
   */
  if (req.body.anulacion_motivo && req.body.anulacion_motivo !== "") {
    var redis = req.app.get("redis");
    var socket = req.app.get("socketio");
    var logger = req.app.get("winston");
    const token = req.header("Authorization").split(" ")[1];
    let opCajaAnulacion;
    /**------------FALTA VALIDAR QUE COMISION_DT Y COMISION_BANCO
     * ------------SEAN VALORES MENORES O IGUALES AL VALOR DE LA TRANSFERENCIA
     */

    utils.decodeToken(token, tokenDecodificado => {
      //OBTENER DATOS DEL USUARIO DESDE REDIS
      redis.get(tokenDecodificado.id, (err, usuario) => {
        usuario = JSON.parse(usuario);
        //OBTENER DATOS DE CAJA DESDE REDIS
        redis.get(tokenDecodificado.idc, (err, caja) => {
          //INICIA TRANSACCION
          let transf = null;
          return models.sequelize
            .transaction(t => {
              caja = JSON.parse(caja);
              //OBTIENE EL NUMERO DE OPERACION
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
                      //OBTIENE LOS DATOS DE LA TRANSFERENCIA
                      return models.transferencia
                        .findOne({
                          where: {
                            St_documento_codigo: req.body.St_documento_codigo,
                            St_documento_serie: req.body.St_documento_serie,
                            nro_Solicitud: req.body.nro_Solicitud
                          },
                          lock: t.LOCK.UPDATE,
                          transaction: t
                        })
                        .then(async transferencia => {
                          transf = transferencia;
                          //VERIFICA SI LA TRANSFERENCIA YA FUE ANULADA O CANCELADA
                          if (transferencia.st_estado === 2) {
                            throw new Error("Giro ya fue pagado");
                          } else if (transferencia.st_estado === 3) {
                            throw new Error("Giro ya fue reembolsado");
                          } else if (transferencia.st_estado === 4) {
                            throw new Error("Giro ya fue anulado");
                          } else if (transferencia.tipo_giro === "Intercambio" && transferencia.st_autorizada != 1) {
                            throw new Error("Necesita autorizacion para anular un intercambio");
                          }

                          const fechaTransferencia = moment(transferencia.solicitud_fecha_hora);
                          const fechaInicial = moment().subtract(30, "days");
                          if (fechaInicial.isSameOrAfter(fechaTransferencia)) {
                            throw new Error("Solo se puede anular transferencias hasta 30 dias antes");
                          }

                          const hoy = new Date();
                          const yyyy = hoy.getFullYear();
                          const mm = ("0" + (hoy.getMonth() + 1)).slice(-2);
                          const dd = ("0" + hoy.getDate()).slice(-2);
                          const fechaHoy = `${yyyy}-${mm}-${dd}`;
                          await getSaldoCaja(fechaHoy, tokenDecodificado.idc).then(saldos => {
                            //si caja no cuenta con saldo suficiente botar error
                            if (
                              saldos.saldo1 < parseFloat(transferencia.importe) + parseFloat(transferencia.comision_banco) &&
                              caja.verificar_saldo_caja == "VERIFICAR"
                            ) {
                              throw new Error(`Su caja no cuenta con saldo suficiente.`);
                            }
                          });

                          //CREA UNA OPERACION EN CAJA
                          return models.operacion_caja
                            .create(
                              {
                                documento_codigo: req.body.documento_codigo, //BODY
                                documento_serie: req.body.documento_serie, //BODY
                                nro_operacion: nro_operacion + 1,
                                nro_transaccion: nro_operacion + 1,
                                nro_transaccion_dia: nro_operacion_dia + 1,
                                fecha_hora_operacion: Date.now(),
                                id_cliente: transferencia.solicitante_id_cliente, //BODY
                                cliente_razon_social: transferencia.solicitante_razon_social, //BODY
                                oficina_origen_codigo: usuario.oficina_codigo,
                                caja_codigo: tokenDecodificado.idc,
                                fecha_trabajo: caja.fecha_trabajo,
                                cuenta_codigo: req.body.cuenta_codigo, ///?????										//BODY
                                codigo_validador: req.body.codigo_validador, //??									//BODY
                                concepto: req.body.anulacion_motivo, ////??																//BODY
                                tipo_cambio: 0, //BODY
                                moneda1_Ingre: 0, //???suma de valores?????? //BODY
                                moneda1_Egre:
                                  transferencia.moneda == 1
                                    ? parseFloat(transferencia.importe) + parseFloat(transferencia.comision_banco ? transferencia.comision_banco : 0)
                                    : 0, //?suma de valores??????			//BODY
                                moneda2_Ingre: 0,
                                moneda2_Egre:
                                  transferencia.moneda == 2
                                    ? parseFloat(transferencia.importe) + parseFloat(transferencia.comision_banco ? transferencia.comision_banco : 0)
                                    : 0,
                                moneda3_Ingre: 0,
                                moneda3_Egre: 0,
                                modulo: "Anulacion",
                                usuario: tokenDecodificado.id,
                                estado_registro: 4
                              },
                              {
                                transaction: t
                              }
                            )
                            .then(op_Caja => {
                              opCajaAnulacion = op_Caja;
                              return models.recibo_interno
                                .create(
                                  {
                                    recibo_doc_codigo: op_Caja.documento_codigo,
                                    recibo_doc_serie: op_Caja.documento_serie,
                                    recibo_nro: op_Caja.nro_operacion,
                                    recibo_tipo: "EGRESO", // INGRESO EGRESO
                                    recibo_finalidad: "ANULACION", //INTERNO HABILITACION HABILITADO EXTORNO
                                    cuenta_codigo: req.body.cuenta_codigo, // EXTORNO
                                    id_cliente: transferencia.solicitante_id_cliente, //no hay en la trnasferncia
                                    razon_social: transferencia.solicitante_razon_social,
                                    recibo_concepto:
                                      "ANULACION: " +
                                      transferencia.St_documento_codigo +
                                      "-" +
                                      transferencia.St_documento_serie +
                                      "-" +
                                      transferencia.nro_Solicitud, //ANULACION DE ST-....
                                    moneda: transferencia.moneda,
                                    importe:
                                      parseFloat(transferencia.importe) + parseFloat(transferencia.comision_banco ? transferencia.comision_banco : 0), //suma de valores DEPENDE
                                    recibo_obs: req.body.anulacion_motivo,
                                    recibo_fecha_hora: Date.now(),
                                    estado_registro: 4,
                                    anulacion_doc_codigo: transferencia.St_documento_codigo,
                                    anulacion_doc_serie: transferencia.St_documento_serie,
                                    anulacion_recibo_nro: transferencia.nro_Solicitud
                                  },
                                  {
                                    transaction: t
                                  }
                                )
                                .then(recibo_interno => {
                                  //ACTUALIZA EL ESTADO DE LA TRANSFERENCIA A ANULADO
                                  return models.transferencia.update(
                                    {
                                      anulacion_usuario: tokenDecodificado.id,
                                      anulacion_motivo: req.body.anulacion_motivo,
                                      anulacion_fecha_hora: Date.now(),
                                      st_estado: 4,
                                      autorizacion_estado: false
                                    },
                                    {
                                      where: {
                                        St_documento_codigo: req.body.St_documento_codigo,
                                        St_documento_serie: req.body.St_documento_serie,
                                        nro_Solicitud: req.body.nro_Solicitud
                                      },
                                      transaction: t
                                    }
                                  );
                                });
                            });
                        });
                    });
                });
            })
            .then(result => {
              let oficina_origen;
              let oficina_destino;
              models.sequelize
              .query(
                `select ofio.oficina_nombre as origen, ofid.oficina_nombre as destino
                from transferencia t left join oficina ofio on (t.oficina_codigo_origen = ofio.oficina_codigo) left join oficina ofid on (t.oficina_codigo_destino = ofid.oficina_codigo)
                where t."St_documento_codigo" = '${transf.St_documento_codigo}' and t."St_documento_serie" = ${transf.St_documento_serie} and t."nro_Solicitud" = ${transf.nro_Solicitud}`,
                {
                type: models.sequelize.QueryTypes.SELECT
                }
              )
              .then(respuesta => {
                oficina_origen = respuesta[0].origen;
                oficina_destino = respuesta[0].destino;
                NotificacionEgreso(
                  redis,
                  socket,
                  "ANULACION",
                  transf.importe,
                  `Giro anulado por un monto de ${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(transf.importe)}`,
                  `Origen: ${oficina_origen} Destino: ${oficina_destino}`,
                  `${opCajaAnulacion.documento_codigo}${opCajaAnulacion.documento_serie}-${opCajaAnulacion.nro_operacion}`,
                  tokenDecodificado.id
                );
              });
              
              res.json({
                nro_operacion: opCajaAnulacion.nro_operacion,
                fecha_hora_operacion: opCajaAnulacion.fecha_hora_operacion
              });
              // Transaction has been committed
              // result is whatever the result of the promise chain returned to the transaction callback
            })
            .catch(err => {
              logger.log("error", {
                ubicacion: filename,
                token: token,
                message: { mensaje: err.message, tracestack: err.stack }
              });
              res.status(412).send(err.message);
              // Transaction has been rolled back
              // err is whatever rejected the promise chain returned to the transaction callback
            });
        });
      });
    });
  } else {
    res.status(412).send("Ingrese un motivo de anulacion");
  }
};

exports.realizarDevolucion = (req, res) => {
  if (req.body.anulacion_motivo && req.body.anulacion_motivo !== "") {
    var redis = req.app.get("redis");
    var socket = req.app.get("socketio");
    var logger = req.app.get("winston");
    const token = req.header("Authorization").split(" ")[1];
    let opCajaAnulacion;
    utils.decodeToken(token, tokenDecodificado => {
      //OBTENER DATOS DEL USUARIO DESDE REDIS
      redis.get(tokenDecodificado.id, (err, usuario) => {
        usuario = JSON.parse(usuario);
        //OBTENER DATOS DE CAJA DESDE REDIS
        redis.get(tokenDecodificado.idc, (err, caja) => {
          let transf = null;
          //INICIA TRANSACCION
          return models.sequelize
            .transaction(t => {
              caja = JSON.parse(caja);
              //OBTIENE EL NUMERO DE OPERACION
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
                      //OBTIENE LOS DATOS DE LA TRANSFERENCIA
                      return models.transferencia
                        .findOne({
                          where: {
                            St_documento_codigo: req.body.St_documento_codigo,
                            St_documento_serie: req.body.St_documento_serie,
                            nro_Solicitud: req.body.nro_Solicitud
                          },
                          lock: t.LOCK.UPDATE,
                          transaction: t
                        })
                        .then(async transferencia => {
                          transf = transferencia;
                          //VERIFICA SI LA TRANSFERENCIA YA FUE ANULADA O CANCELADA
                          if (transferencia.st_estado === 2) {
                            throw new Error("Giro ya fue cancelado");
                          } else if (transferencia.st_estado === 3) {
                            throw new Error("Giro ya fue reembolsado");
                          } else if (transferencia.st_estado === 4) {
                            throw new Error("Giro ya fue anulado");
                          } else if (transferencia.autorizacion_estado === false) {
                            throw new Error("Ya se realizo la devolucion del giro");
                          } else if (transferencia.st_autorizada !== 1) {
                            throw new Error("Usted no esta autorizado para realizar una devolucion");
                          }

                          const hoy = new Date();
                          const yyyy = hoy.getFullYear();
                          const mm = ("0" + (hoy.getMonth() + 1)).slice(-2);
                          const dd = ("0" + hoy.getDate()).slice(-2);
                          const fechaHoy = `${yyyy}-${mm}-${dd}`;
                          await getSaldoCaja(fechaHoy, tokenDecodificado.idc).then(saldos => {
                            //si caja no cuenta con saldo suficiente botar error
                            if (
                              saldos.saldo1 < parseFloat(transferencia.importe) + parseFloat(transferencia.comision_banco) &&
                              caja.verificar_saldo_caja == "VERIFICAR"
                            ) {
                              throw new Error(`Su caja no cuenta con saldo suficiente.`);
                            }
                          });

                          //CREA UNA OPERACION EN CAJA
                          return models.operacion_caja
                            .create(
                              {
                                documento_codigo: req.body.documento_codigo, //BODY
                                documento_serie: req.body.documento_serie, //BODY
                                nro_operacion: nro_operacion + 1,
                                nro_transaccion: nro_operacion + 1,
                                nro_transaccion_dia: nro_operacion_dia + 1,
                                fecha_hora_operacion: Date.now(),
                                id_cliente: transferencia.solicitante_id_cliente, //BODY
                                cliente_razon_social: transferencia.solicitante_razon_social, //BODY
                                oficina_origen_codigo: usuario.oficina_codigo,
                                caja_codigo: tokenDecodificado.idc,
                                fecha_trabajo: caja.fecha_trabajo,
                                cuenta_codigo: req.body.cuenta_codigo, ///?????										//BODY
                                codigo_validador: req.body.codigo_validador, //??									//BODY
                                concepto: req.body.anulacion_motivo, ////??																//BODY
                                tipo_cambio: 0, //BODY
                                moneda1_Ingre: 0, //???suma de valores?????? //BODY
                                moneda1_Egre:
                                  transferencia.moneda == 1
                                    ? parseFloat(transferencia.importe) + parseFloat(transferencia.comision_banco ? transferencia.comision_banco : 0)
                                    : 0, //?suma de valores??????			//BODY
                                moneda2_Ingre: 0,
                                moneda2_Egre:
                                  transferencia.moneda == 2
                                    ? parseFloat(transferencia.importe) + parseFloat(transferencia.comision_banco ? transferencia.comision_banco : 0)
                                    : 0,
                                moneda3_Ingre: 0,
                                moneda3_Egre: 0,
                                modulo: "Anulacion",
                                usuario: tokenDecodificado.id,
                                estado_registro: 4
                              },
                              {
                                transaction: t
                              }
                            )
                            .then(op_Caja => {
                              opCajaAnulacion = op_Caja;
                              return models.recibo_interno
                                .create(
                                  {
                                    recibo_doc_codigo: op_Caja.documento_codigo,
                                    recibo_doc_serie: op_Caja.documento_serie,
                                    recibo_nro: op_Caja.nro_operacion,
                                    recibo_tipo: "EGRESO", // INGRESO EGRESO
                                    recibo_finalidad: "DEVOLUCION", //INTERNO HABILITACION HABILITADO EXTORNO
                                    cuenta_codigo: req.body.cuenta_codigo, // EXTORNO
                                    id_cliente: transferencia.solicitante_id_cliente, //no hay en la trnasferncia
                                    razon_social: transferencia.solicitante_razon_social,
                                    recibo_concepto:
                                      "DEVOLUCION: " +
                                      transferencia.St_documento_codigo +
                                      "-" +
                                      transferencia.St_documento_serie +
                                      "-" +
                                      transferencia.nro_Solicitud, //ANULACION DE ST-....
                                    moneda: transferencia.moneda,
                                    importe:
                                      parseFloat(transferencia.importe) + parseFloat(transferencia.comision_banco ? transferencia.comision_banco : 0), //suma de valores DEPENDE
                                    recibo_obs: req.body.anulacion_motivo,
                                    recibo_fecha_hora: Date.now(),
                                    estado_registro: 4,
                                    anulacion_doc_codigo: transferencia.St_documento_codigo,
                                    anulacion_doc_serie: transferencia.St_documento_serie,
                                    anulacion_recibo_nro: transferencia.nro_Solicitud
                                  },
                                  {
                                    transaction: t
                                  }
                                )
                                .then(recibo_interno => {
                                  //ACTUALIZA EL ESTADO DE LA TRANSFERENCIA A ANULADO
                                  return models.transferencia.update(
                                    {
                                      anulacion_usuario: tokenDecodificado.id,
                                      anulacion_motivo: req.body.anulacion_motivo,
                                      anulacion_fecha_hora: Date.now(),
                                      st_estado: 4,
                                      autorizacion_estado: false
                                    },
                                    {
                                      where: {
                                        St_documento_codigo: req.body.St_documento_codigo,
                                        St_documento_serie: req.body.St_documento_serie,
                                        nro_Solicitud: req.body.nro_Solicitud
                                      },
                                      transaction: t
                                    }
                                  );
                                });
                            });
                        });
                    });
                });
            })
            .then(result => {
              let oficina_origen;
              let oficina_destino;
              models.sequelize
              .query(
                `select ofio.oficina_nombre as origen, ofid.oficina_nombre as destino
                from transferencia t left join oficina ofio on (t.oficina_codigo_origen = ofio.oficina_codigo) left join oficina ofid on (t.oficina_codigo_destino = ofid.oficina_codigo)
                where t."St_documento_codigo" = '${transf.St_documento_codigo}' and t."St_documento_serie" = ${transf.St_documento_serie} and t."nro_Solicitud" = ${transf.nro_Solicitud}`,
                {
                type: models.sequelize.QueryTypes.SELECT
                }
              )
              .then(respuesta => {
                oficina_origen = respuesta[0].origen;
                oficina_destino = respuesta[0].destino;
                NotificacionEgreso(
                  redis,
                  socket,
                  "DEVOLUCION",
                  transf.importe,
                  `Giro devuelto por un monto de ${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(transf.importe)}`,
                  `Origen: ${oficina_origen} Destino: ${oficina_destino}`,
                  `${opCajaAnulacion.documento_codigo}${opCajaAnulacion.documento_serie}-${opCajaAnulacion.nro_operacion}`,
                  tokenDecodificado.id
                );
              });
              
              res.json({
                nro_operacion: opCajaAnulacion.nro_operacion,
                fecha_hora_operacion: opCajaAnulacion.fecha_hora_operacion
              });
              // Transaction has been committed
              // result is whatever the result of the promise chain returned to the transaction callback
            })
            .catch(err => {
              logger.log("error", {
                ubicacion: filename,
                token: token,
                message: { mensaje: err.message, tracestack: err.stack }
              });
              res.status(412).send(err.message);
              // Transaction has been rolled back
              // err is whatever rejected the promise chain returned to the transaction callback
            });
        });
      });
    });
  } else {
    res.status(412).send("Ingrese un motivo de anulacion");
  }
};

exports.realizarReembolso = (req, res) => {
  //definir la finalidad del recibo de egreso
  req.body.recibo_finalidad = "REEMBOLSO";
  if (req.body.anulacion_motivo && req.body.anulacion_motivo !== "") {
    var redis = req.app.get("redis");
    var socket = req.app.get("socketio");
    var logger = req.app.get("winston");
    const token = req.header("Authorization").split(" ")[1];
    let opCajaAnulacion;
    utils.decodeToken(token, tokenDecodificado => {
      //OBTENER DATOS DEL USUARIO DESDE REDIS
      redis.get(tokenDecodificado.id, (err, usuario) => {
        usuario = JSON.parse(usuario);
        //OBTENER DATOS DE CAJA DESDE REDIS
        redis.get(tokenDecodificado.idc, (err, caja) => {
          let transf = null;
          //INICIA TRANSACCION
          return models.sequelize
            .transaction(t => {
              caja = JSON.parse(caja);
              //OBTIENE EL NUMERO DE OPERACION
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
                      //OBTIENE LOS DATOS DE LA TRANSFERENCIA
                      return models.transferencia
                        .findOne({
                          where: {
                            St_documento_codigo: req.body.St_documento_codigo,
                            St_documento_serie: req.body.St_documento_serie,
                            nro_Solicitud: req.body.nro_Solicitud
                          },
                          lock: t.LOCK.UPDATE,
                          transaction: t
                        })
                        .then(async transferencia => {
                          transf = transferencia;
                          //VERIFICA SI LA TRANSFERENCIA YA FUE ANULADA O CANCELADA
                          if (transferencia.st_estado === 2) {
                            throw new Error("Giro ya fue cancelado");
                          } else if (transferencia.st_estado === 3) {
                            throw new Error("Giro ya fue reembolsado");
                          } else if (transferencia.st_estado === 4) {
                            throw new Error("Giro ya fue anulado");
                          } else if (transferencia.autorizacion_estado === false) {
                            throw new Error("Giro ya fue reembolsado");
                          } else if (transferencia.st_autorizada !== 2) {
                            throw new Error("Usted no esta autorizado para realizar un reembolso");
                          }

                          const hoy = new Date();
                          const yyyy = hoy.getFullYear();
                          const mm = ("0" + (hoy.getMonth() + 1)).slice(-2);
                          const dd = ("0" + hoy.getDate()).slice(-2);
                          const fechaHoy = `${yyyy}-${mm}-${dd}`;
                          await getSaldoCaja(fechaHoy, tokenDecodificado.idc).then(saldos => {
                            //si caja no cuenta con saldo suficiente botar error
                            if (
                              saldos.saldo1 <
                                parseFloat(transferencia.importe) +
                                  parseFloat(transferencia.comision_dt) +
                                  parseFloat(transferencia.comision_banco) &&
                              caja.verificar_saldo_caja == "VERIFICAR"
                            ) {
                              throw new Error(`Su caja no cuenta con saldo suficiente.`);
                            }
                          });
                          //CREA UNA OPERACION EN CAJA
                          return models.operacion_caja
                            .create(
                              {
                                documento_codigo: req.body.documento_codigo, //BODY
                                documento_serie: req.body.documento_serie, //BODY
                                nro_operacion: nro_operacion + 1,
                                nro_transaccion: nro_operacion + 1,
                                nro_transaccion_dia: nro_operacion_dia + 1,
                                fecha_hora_operacion: Date.now(),
                                id_cliente: transferencia.solicitante_id_cliente, //BODY
                                cliente_razon_social: transferencia.solicitante_razon_social, //BODY
                                oficina_origen_codigo: usuario.oficina_codigo,
                                caja_codigo: tokenDecodificado.idc,
                                fecha_trabajo: caja.fecha_trabajo,
                                cuenta_codigo: req.body.cuenta_codigo, ///?????										//BODY
                                codigo_validador: req.body.codigo_validador, //??									//BODY
                                concepto: req.body.anulacion_motivo, ////??																//BODY
                                tipo_cambio: 0, //BODY
                                moneda1_Ingre: 0, //???suma de valores?????? //BODY
                                moneda1_Egre:
                                  transferencia.moneda == 1
                                    ? parseFloat(transferencia.importe) +
                                      parseFloat(transferencia.comision_dt ? transferencia.comision_dt : 0) +
                                      parseFloat(transferencia.comision_banco ? transferencia.comision_banco : 0)
                                    : 0, //?suma de valores??????			//BODY
                                moneda2_Ingre: 0,
                                moneda2_Egre:
                                  transferencia.moneda == 2
                                    ? parseFloat(transferencia.importe) +
                                      parseFloat(transferencia.comision_dt ? transferencia.comision_dt : 0) +
                                      parseFloat(transferencia.comision_banco ? transferencia.comision_banco : 0)
                                    : 0,
                                moneda3_Ingre: 0,
                                moneda3_Egre: 0,
                                modulo: "Reembolso",
                                usuario: tokenDecodificado.id,
                                estado_registro: 3
                              },
                              {
                                transaction: t
                              }
                            )
                            .then(op_Caja => {
                              opCajaAnulacion = op_Caja;
                              return models.recibo_interno
                                .create(
                                  {
                                    recibo_doc_codigo: op_Caja.documento_codigo,
                                    recibo_doc_serie: op_Caja.documento_serie,
                                    recibo_nro: op_Caja.nro_operacion,
                                    recibo_tipo: "EGRESO", // INGRESO EGRESO
                                    recibo_finalidad: "REEMBOLSO", //INTERNO HABILITACION HABILITADO EXTORNO
                                    cuenta_codigo: req.body.cuenta_codigo, // EXTORNO
                                    id_cliente: transferencia.solicitante_id_cliente, //no hay en la trnasferncia
                                    razon_social: transferencia.solicitante_razon_social,
                                    recibo_concepto:
                                      "REEMBOLSO" +
                                      ": " +
                                      transferencia.St_documento_codigo +
                                      "-" +
                                      transferencia.St_documento_serie +
                                      "-" +
                                      transferencia.nro_Solicitud, //ANULACION DE ST-....
                                    moneda: transferencia.moneda,
                                    importe:
                                      parseFloat(transferencia.importe) +
                                      parseFloat(transferencia.comision_dt ? transferencia.comision_dt : 0) +
                                      parseFloat(transferencia.comision_banco ? transferencia.comision_banco : 0), //suma de valores DEPENDE
                                    recibo_obs: req.body.anulacion_motivo,
                                    recibo_fecha_hora: Date.now(),
                                    estado_registro: 4,
                                    anulacion_doc_codigo: transferencia.St_documento_codigo,
                                    anulacion_doc_serie: transferencia.St_documento_serie,
                                    anulacion_recibo_nro: transferencia.nro_Solicitud
                                  },
                                  {
                                    transaction: t
                                  }
                                )
                                .then(recibo_interno => {
                                  //ACTUALIZA EL ESTADO DE LA TRANSFERENCIA A ANULADO
                                  return models.transferencia.update(
                                    {
                                      anulacion_usuario: tokenDecodificado.id,
                                      anulacion_motivo: req.body.anulacion_motivo,
                                      anulacion_fecha_hora: Date.now(),
                                      st_estado: 3,
                                      autorizacion_estado: false
                                    },
                                    {
                                      where: {
                                        St_documento_codigo: req.body.St_documento_codigo,
                                        St_documento_serie: req.body.St_documento_serie,
                                        nro_Solicitud: req.body.nro_Solicitud
                                      },
                                      transaction: t
                                    }
                                  );
                                });
                            });
                        });
                    });
                });
            })
            .then(result => {
              let oficina_origen;
              let oficina_destino;
              models.sequelize
              .query(
                `select ofio.oficina_nombre as origen, ofid.oficina_nombre as destino
                from transferencia t left join oficina ofio on (t.oficina_codigo_origen = ofio.oficina_codigo) left join oficina ofid on (t.oficina_codigo_destino = ofid.oficina_codigo)
                where t."St_documento_codigo" = '${transf.St_documento_codigo}' and t."St_documento_serie" = ${transf.St_documento_serie} and t."nro_Solicitud" = ${transf.nro_Solicitud}`,
                {
                type: models.sequelize.QueryTypes.SELECT
                }
              )
              .then(respuesta => {
                oficina_origen = respuesta[0].origen;
                oficina_destino = respuesta[0].destino;
                NotificacionEgreso(
                  redis,
                  socket,
                  "REEMBOLSO",
                  transf.importe,
                  `Giro reembolsado por un monto de ${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(transf.importe)}`,
                  `Origen: ${oficina_origen} Destino: ${oficina_destino}`,
                  `${opCajaAnulacion.documento_codigo}${opCajaAnulacion.documento_serie}-${opCajaAnulacion.nro_operacion}`,
                  tokenDecodificado.id
                );
              });
              
              res.json({
                nro_operacion: opCajaAnulacion.nro_operacion,
                fecha_hora_operacion: opCajaAnulacion.fecha_hora_operacion
              });
              // Transaction has been committed
              // result is whatever the result of the promise chain returned to the transaction callback
            })
            .catch(err => {
              logger.log("error", {
                ubicacion: filename,
                token: token,
                message: { mensaje: err.message, tracestack: err.stack }
              });
              res.status(412).send(err.message);
              // Transaction has been rolled back
              // err is whatever rejected the promise chain returned to the transaction callback
            });
        });
      });
    });
  } else {
    reject("Ingrese un motivo de anulacion");
  }
};

exports.realizarCambioDestino = (req, res) => {
  /**
   *
   * 	PRIMERO SE REALIZA LA OPERACION DE REEMBOLSO Y LUEGO SE CREA LA NUEVA TRANSFERNCIA
   *
   * 	ES LARGO PORQUE TODO DEBE ESTAR EN UNA SOLA TRANSACCION POR SI ALGO FALLA
   *
   *  NO ME JUZGEN
   *
   */
  if (req.body.anulacion_motivo && req.body.anulacion_motivo !== "") {
    var redis = req.app.get("redis");
    var socket = req.app.get("socketio");
    var logger = req.app.get("winston");
    const token = req.header("Authorization").split(" ")[1];
    let opCajaAnulacion;
    let opCajaNuevo;
    let tranferenciaBuscada = null;
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
              //OBTIENE EL NUMERO DE OPERACION
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
                      //OBTIENE LOS DATOS DE LA TRANSFERENCIA
                      return models.transferencia
                        .findOne({
                          where: {
                            St_documento_codigo: req.body.St_documento_codigo,
                            St_documento_serie: req.body.St_documento_serie,
                            nro_Solicitud: req.body.nro_Solicitud
                          },
                          lock: t.LOCK.UPDATE,
                          transaction: t
                        })
                        .then(transferencia => {
                          tranferenciaBuscada = transferencia;
                          //VERIFICA SI LA TRANSFERENCIA YA FUE ANULADA O CANCELADA
                          if (transferencia.st_estado === 2) {
                            throw new Error("Giro ya fue cancelado");
                          } else if (transferencia.st_estado === 3) {
                            throw new Error("Giro ya fue reembolsado");
                          } else if (transferencia.st_estado === 4) {
                            throw new Error("Giro ya fue anulado");
                          } else if (transferencia.st_autorizada !== 3) {
                            throw new Error("Usted no esta autorizado para realizar un cambio de destino");
                          }
                          //CREA UNA OPERACION EN CAJA
                          return models.operacion_caja
                            .create(
                              {
                                documento_codigo: req.body.documento_codigo, //BODY
                                documento_serie: req.body.documento_serie, //BODY
                                nro_operacion: nro_operacion + 1,
                                nro_transaccion: nro_operacion + 1,
                                nro_transaccion_dia: nro_operacion_dia + 1,
                                fecha_hora_operacion: Date.now(),
                                id_cliente: transferencia.solicitante_id_cliente, //BODY
                                cliente_razon_social: "CAMBIO DESTINO " + transferencia.solicitante_razon_social, //BODY
                                oficina_origen_codigo: usuario.oficina_codigo,
                                caja_codigo: tokenDecodificado.idc,
                                fecha_trabajo: caja.fecha_trabajo,
                                cuenta_codigo: req.body.cuenta_codigo, ///?????										//BODY
                                codigo_validador: req.body.codigo_validador, //??									//BODY
                                concepto: req.body.anulacion_motivo, ////??																//BODY
                                tipo_cambio: 0, //BODY
                                moneda1_Ingre: 0, //???suma de valores?????? //BODY
                                moneda1_Egre:
                                  transferencia.moneda == 1
                                    ? parseFloat(transferencia.importe) +
                                      parseFloat(transferencia.comision_dt ? transferencia.comision_dt : 0) +
                                      parseFloat(transferencia.comision_banco ? transferencia.comision_banco : 0)
                                    : 0, //?suma de valores??????			//BODY
                                moneda2_Ingre: 0,
                                moneda2_Egre:
                                  transferencia.moneda == 2
                                    ? parseFloat(transferencia.importe) +
                                      parseFloat(transferencia.comision_dt ? transferencia.comision_dt : 0) +
                                      parseFloat(transferencia.comision_banco ? transferencia.comision_banco : 0)
                                    : 0,
                                moneda3_Ingre: 0,
                                moneda3_Egre: 0,
                                modulo: "Anulacion",
                                usuario: tokenDecodificado.id,
                                estado_registro: 4
                              },
                              {
                                transaction: t
                              }
                            )
                            .then(op_Caja => {
                              opCajaAnulacion = op_Caja;
                              return models.recibo_interno
                                .create(
                                  {
                                    recibo_doc_codigo: op_Caja.documento_codigo,
                                    recibo_doc_serie: op_Caja.documento_serie,
                                    recibo_nro: op_Caja.nro_operacion,
                                    recibo_tipo: "EGRESO", // INGRESO EGRESO
                                    recibo_finalidad: "CAMBIO DESTINO", //INTERNO HABILITACION HABILITADO EXTORNO
                                    cuenta_codigo: req.body.cuenta_codigo, // EXTORNO
                                    id_cliente: transferencia.solicitante_id_cliente, //no hay en la trnasferncia
                                    razon_social: transferencia.solicitante_razon_social,
                                    recibo_concepto:
                                      "CAMBIO DEST: " +
                                      transferencia.St_documento_codigo +
                                      "-" +
                                      transferencia.St_documento_serie +
                                      "-" +
                                      transferencia.nro_Solicitud, //ANULACION DE ST-....
                                    moneda: transferencia.moneda,
                                    importe:
                                      parseFloat(transferencia.importe) +
                                      parseFloat(transferencia.comision_dt ? transferencia.comision_dt : 0) +
                                      parseFloat(transferencia.comision_banco ? transferencia.comision_banco : 0), //suma de valores DEPENDE
                                    recibo_obs: req.body.anulacion_motivo,
                                    recibo_fecha_hora: Date.now(),
                                    estado_registro: 4,
                                    anulacion_doc_codigo: transferencia.St_documento_codigo,
                                    anulacion_doc_serie: transferencia.St_documento_serie,
                                    anulacion_recibo_nro: transferencia.nro_Solicitud
                                  },
                                  {
                                    transaction: t
                                  }
                                )
                                .then(recibo_interno => {
                                  //ACTUALIZA EL ESTADO DE LA TRANSFERENCIA A ANULADO
                                  return models.transferencia
                                    .update(
                                      {
                                        anulacion_usuario: tokenDecodificado.id,
                                        anulacion_motivo: req.body.anulacion_motivo,
                                        anulacion_fecha_hora: Date.now(),
                                        st_estado: 3,
                                        autorizacion_estado: false
                                      },
                                      {
                                        where: {
                                          St_documento_codigo: req.body.St_documento_codigo,
                                          St_documento_serie: req.body.St_documento_serie,
                                          nro_Solicitud: req.body.nro_Solicitud
                                        },
                                        transaction: t
                                      }
                                    )
                                    .then(async transUpdate => {
                                      /**
                                       *
                                       *
                                       *
                                       * DESDE ESTE PUNTO SE CREA LA NUEVA TRANSFERENCIA
                                       * SE CREA CON EL MISMO DOCUMENTO Y SERIE CON LA QUE SE CREO LA TRANSFERNCIA ORIGINAL
                                       *
                                       * ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
                                       *
                                       *
                                       */
                                      let comision_dt_calculado = await calcularMaxDT(
                                        tranferenciaBuscada.oficina_codigo_origen,
                                        req.body.oficina_codigo_destino,
                                        tranferenciaBuscada.importe
                                      );
                                      let nuevo_importe = parseFloat(tranferenciaBuscada.importe);
                                      let nueva_comision_dt = Math.floor((comision_dt_calculado / 2) * 10) / 10;
                                      if (nueva_comision_dt !== req.body.gastos_administrativos) {
                                        throw new Error("El monto de reintegro no es valido, actualize su Base de datos de DT's");
                                      }

                                      if (req.body.descontar_importe) {
                                        nuevo_importe = nuevo_importe - nueva_comision_dt;
                                      }

                                      return models.operacion_caja
                                        .findAll(
                                          {
                                            limit: 1,
                                            where: {
                                              documento_codigo: tranferenciaBuscada.St_documento_codigo,
                                              documento_serie: tranferenciaBuscada.St_documento_serie
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
                                                documento_codigo: tranferenciaBuscada.St_documento_codigo,
                                                documento_serie: tranferenciaBuscada.St_documento_serie
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
                                              /**
                                               * SOLO SE USA SI SE PROPORCIONA UN ID CLIENTE QUE NO EXISTE EN LA BD
                                               */
                                              const cliente = await models.cliente_proveedor.findByPk(tranferenciaBuscada.beneficiario_docident);
                                              let beneficiario_id_cliente = {};
                                              let id_cliente = {};
                                              if (cliente !== null) {
                                                beneficiario_id_cliente = {
                                                  beneficiario_id_cliente: tranferenciaBuscada.beneficiario_docident
                                                };
                                                id_cliente = {
                                                  id_cliente: tranferenciaBuscada.beneficiario_docident
                                                };
                                              }
                                              /************************************************************ */
                                              return models.operacion_caja
                                                .create(
                                                  {
                                                    documento_codigo: tranferenciaBuscada.St_documento_codigo, //BODY
                                                    documento_serie: tranferenciaBuscada.St_documento_serie, //BODY
                                                    nro_operacion: nro_operacion + 1,
                                                    nro_transaccion: nro_operacion + 1,
                                                    nro_transaccion_dia: nro_operacion_dia + 1,
                                                    fecha_hora_operacion: Date.now(),
                                                    ...id_cliente,
                                                    cliente_razon_social: tranferenciaBuscada.solicitante_razon_social, //BODY
                                                    oficina_origen_codigo: usuario.oficina_codigo,
                                                    caja_codigo: tokenDecodificado.idc,
                                                    fecha_trabajo: caja.fecha_trabajo,
                                                    cuenta_codigo: req.body.cuenta_codigo, ///?????										//BODY
                                                    codigo_validador: req.body.codigo_validador, //??									//BODY
                                                    concepto: "CAMBIO DE DESTINO", ////??																//BODY
                                                    tipo_cambio: 0, //BODY
                                                    moneda1_Ingre:
                                                      tranferenciaBuscada.moneda == 1
                                                        ? nueva_comision_dt +
                                                          nuevo_importe +
                                                          parseFloat(tranferenciaBuscada.comision_dt) +
                                                          (tranferenciaBuscada.comision_banco ? parseFloat(tranferenciaBuscada.comision_banco) : 0)
                                                        : 0, //???suma de valores?????? //BODY
                                                    moneda1_Egre: 0, //?suma de valores??????			//BODY
                                                    moneda2_Ingre:
                                                      tranferenciaBuscada.moneda == 2
                                                        ? nueva_comision_dt +
                                                          nuevo_importe +
                                                          parseFloat(tranferenciaBuscada.comision_dt) +
                                                          (tranferenciaBuscada.comision_banco ? parseFloat(tranferenciaBuscada.comision_banco) : 0)
                                                        : 0,
                                                    moneda2_Egre: 0,
                                                    moneda3_Ingre: 0,
                                                    moneda3_Egre: 0,
                                                    modulo: tranferenciaBuscada.tipo_giro,
                                                    usuario: tokenDecodificado.id,
                                                    estado_registro: 1
                                                  },
                                                  {
                                                    transaction: t
                                                  }
                                                )
                                                .then(op_Caja => {
                                                  opCajaNuevo = op_Caja;
                                                  return models.transferencia.create(
                                                    {
                                                      St_documento_codigo: op_Caja.documento_codigo,
                                                      St_documento_serie: op_Caja.documento_serie,
                                                      nro_Solicitud: op_Caja.nro_operacion,
                                                      oficina_codigo_origen: op_Caja.oficina_origen_codigo,
                                                      oficina_codigo_destino: req.body.oficina_codigo_destino,
                                                      solicitud_fecha_hora: Date.now(),
                                                      ...beneficiario_id_cliente,
                                                      beneficiario_razon_social: tranferenciaBuscada.beneficiario_razon_social,
                                                      beneficiario_docident: tranferenciaBuscada.beneficiario_docident,
                                                      beneficiario_otros_datos: tranferenciaBuscada.beneficiario_otros_datos,
                                                      solicitante_id_cliente: tranferenciaBuscada.solicitante_id_cliente,
                                                      solicitante_razon_social: tranferenciaBuscada.solicitante_razon_social,
                                                      solicitante_otros_datos: tranferenciaBuscada.solicitante_otros_datos,
                                                      moneda: tranferenciaBuscada.moneda,
                                                      importe: nuevo_importe,
                                                      comision_dt: tranferenciaBuscada.comision_dt,
                                                      comision_banco: tranferenciaBuscada.comision_banco,
                                                      gastos_administrativos: nueva_comision_dt,
                                                      deposito_entidad_codigo: tranferenciaBuscada.deposito_entidad_codigo,
                                                      deposito_nro_cuenta: tranferenciaBuscada.deposito_nro_cuenta,
                                                      deposito_tipo: tranferenciaBuscada.deposito_tipo,
                                                      deposito_destino: tranferenciaBuscada.deposito_destino,
                                                      beneficiario_nro_celular: tranferenciaBuscada.beneficiario_nro_celular,
                                                      solicitante_nro_celular: tranferenciaBuscada.solicitante_nro_celular,
                                                      solicitud_obs: tranferenciaBuscada.solicitud_obs,
                                                      solicitud_msj: tranferenciaBuscada.solicitud_msj,
                                                      st_estado: 1,
                                                      tipo_giro: tranferenciaBuscada.tipo_giro
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
                        });
                    });
                });
            })
            .then(result => {
              let oficina_origen;
              let oficina_destino;
              models.sequelize
              .query(
                `select ofio.oficina_nombre as origen, ofid.oficina_nombre as destino
                from transferencia t left join oficina ofio on (t.oficina_codigo_origen = ofio.oficina_codigo) left join oficina ofid on (t.oficina_codigo_destino = ofid.oficina_codigo)
                where t."St_documento_codigo" = '${tranferenciaBuscada.St_documento_codigo}' and t."St_documento_serie" = ${tranferenciaBuscada.St_documento_serie} and t."nro_Solicitud" = ${tranferenciaBuscada.nro_Solicitud}`,
                {
                type: models.sequelize.QueryTypes.SELECT
                }
              )
              .then(respuesta => {
                oficina_origen = respuesta[0].origen;
                oficina_destino = respuesta[0].destino;
                NotificacionEgreso(
                  redis,
                  socket,
                  "CAMBIO DE DESTINO",
                  tranferenciaBuscada.importe,
                  `Cambio de destino por un monto de ${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(tranferenciaBuscada.importe)}`,
                  `Origen: ${oficina_origen} Destino: ${oficina_destino}`,
                  `Reembolsado: ${tranferenciaBuscada.St_documento_codigo}${tranferenciaBuscada.St_documento_serie}-${tranferenciaBuscada.nro_Solicitud} - Nuevo: ${opCajaNuevo.documento_codigo}${opCajaNuevo.documento_serie}-${opCajaNuevo.nro_operacion}`,
                  tokenDecodificado.id
                );
              });
              
              res.json({
                St_documento_codigo: result.St_documento_codigo,
                St_documento_serie: result.St_documento_serie,
                nro_Solicitud: result.nro_Solicitud,
                oficina_codigo_origen: result.oficina_codigo_origen,
                importe: result.importe,
                fecha_hora_operacion: result.solicitud_fecha_hora,
                gastos_administrativos: result.gastos_administrativos
              });
              // Transaction has been committed
              // result is whatever the result of the promise chain returned to the transaction callback
            })
            .catch(err => {
              logger.log("error", {
                ubicacion: filename,
                token: token,
                message: { mensaje: err.message, tracestack: err.stack }
              });
              res.status(412).send(err.message);
              //res.status(412).send(err.message);
              // Transaction has been rolled back
              // err is whatever rejected the promise chain returned to the transaction callback
            });
        });
      });
    });
  } else {
    logger.log("warn", {
      ubicacion: filename,
      token: token,
      message: "Ingrese un motivo de anulacion"
    });
    res.status(412).send("Ingrese un motivo de anulacion");
  }
};

exports.realizarCambioBeneficiario = (req, res) => {
  var redis = req.app.get("redis");
  var socket = req.app.get("socketio");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  let transferenciaOriginal;
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
            return models.transferencia
              .findOne({
                where: {
                  St_documento_codigo: req.body.St_documento_codigo,
                  St_documento_serie: req.body.St_documento_serie,
                  nro_Solicitud: req.body.nro_Solicitud
                },
                lock: t.LOCK.UPDATE,
                transaction: t
              })
              .then(async transferencia => {
                transferenciaOriginal = transferencia;
                //VERIFICA SI LA TRANSFERENCIA YA FUE ANULADA O CANCELADA
                if (transferencia.st_estado === 2) {
                  throw new Error("Giro ya fue cancelado");
                } else if (transferencia.st_estado === 3) {
                  throw new Error("Giro ya fue reembolsado");
                } else if (transferencia.st_estado === 4) {
                  throw new Error("Giro ya fue anulado");
                } else if (transferencia.autorizacion_estado === false) {
                  throw new Error("Giro ya fue cambiada de beneficiario");
                } else if (transferencia.st_autorizada !== 4) {
                  throw new Error("Usted no esta autorizado para realizar un cambio de beneficiario");
                }
                const cliente = await models.cliente_proveedor.findByPk(req.body.beneficiario_docident);
                let beneficiario_id_cliente = {};
                if (cliente !== null) {
                  beneficiario_id_cliente = {
                    beneficiario_id_cliente: req.body.beneficiario_docident
                  };
                } else {
                  beneficiario_id_cliente = {
                    beneficiario_id_cliente: null
                  };
                }
                return models.transferencia.update(
                  {
                    ...beneficiario_id_cliente,
                    beneficiario_docident: req.body.beneficiario_docident,
                    beneficiario_razon_social: req.body.beneficiario_razon_social,
                    beneficiario_nro_celular: req.body.beneficiario_nro_celular,
                    solicitud_obs: "Beneficiario Original:" + transferencia.beneficiario_razon_social,
                    autorizacion_estado: false
                  },
                  {
                    where: {
                      St_documento_codigo: req.body.St_documento_codigo,
                      St_documento_serie: req.body.St_documento_serie,
                      nro_Solicitud: req.body.nro_Solicitud
                    },
                    transaction: t
                  }
                );
              });
          })
          .then(result => {
            let oficina_origen;
            let oficina_destino;
            models.sequelize
            .query(
              `select ofio.oficina_nombre as origen, ofid.oficina_nombre as destino
              from transferencia t left join oficina ofio on (t.oficina_codigo_origen = ofio.oficina_codigo) left join oficina ofid on (t.oficina_codigo_destino = ofid.oficina_codigo)
              where t."St_documento_codigo" = '${transferenciaOriginal.St_documento_codigo}' and t."St_documento_serie" = ${transferenciaOriginal.St_documento_serie} and t."nro_Solicitud" = ${transferenciaOriginal.nro_Solicitud}`,
              {
              type: models.sequelize.QueryTypes.SELECT
              }
            )
            .then(respuesta => {
              oficina_origen = respuesta[0].origen;
              oficina_destino = respuesta[0].destino;
              NotificacionIngreso(
                redis,
                socket,
                "CAMBIO DE BENEFICIARIO",
                transferenciaOriginal.importe,
                `Cambio de beneficiario por un monto de ${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(
                  transferenciaOriginal.importe
                )}`,
                `Origen: ${oficina_origen} Destino: ${oficina_destino}`,
                `${transferenciaOriginal.St_documento_codigo}${transferenciaOriginal.St_documento_serie}-${transferenciaOriginal.nro_Solicitud}`,
                tokenDecodificado.id
              );
            });
            
            res.json({
              solicitud_obs: "Beneficiario Original:" + transferenciaOriginal.beneficiario_razon_social,
              fecha_hora_operacion: Date.now()
            });
          })
          .catch(err => {
            logger.log("error", {
              ubicacion: filename,
              token: token,
              message: { mensaje: err.message, tracestack: err.stack }
            });
            res.status(412).send(err.message);
          });
      });
    });
  });
};

exports.realizarExtorno = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  let op_caja;
  /**------------FALTA VALIDAR QUE COMISION_DT Y COMISION_BANCO
   * ------------SEAN VALORES MENORES O IGUALES AL VALOR DE LA TRANSFERENCIA
   */
  if (req.body.concepto !== "") {
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
              //OBTIENE EL NUMERO DE OPERACION
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
                      //OBTIENE LOS DATOS DE LA TRANSFERENCIA
                      return models.transferencia
                        .findOne({
                          where: {
                            St_documento_codigo: req.body.St_documento_codigo,
                            St_documento_serie: req.body.St_documento_serie,
                            nro_Solicitud: req.body.nro_Solicitud
                          },
                          lock: t.LOCK.UPDATE,
                          transaction: t
                        })
                        .then(transferencia => {
                          //VERIFICA SI LA TRANSFERENCIA YA FUE ANULADA O CANCELADA
                          if (transferencia.st_estado === 1) {
                            throw new Error("Giro pendiente, no se puede extornar");
                          } else if (transferencia.st_estado === 3) {
                            throw new Error("Giro anulado, no puede ser extornado");
                          } else if (transferencia.st_estado === 4) {
                            throw new Error("Giro reembolsado, no puede ser extornado");
                          } else if (transferencia.autorizacion_estado === false) {
                            throw new Error("Giro ya fue extornado");
                          } else if (transferencia.st_autorizada !== 5) {
                            throw new Error("Usted no esta autorizado para realizar extorno");
                          }
                          //CREA UNA OPERACION EN CAJA
                          return models.operacion_caja
                            .create(
                              {
                                documento_codigo: req.body.documento_codigo, //BODY
                                documento_serie: req.body.documento_serie, //BODY
                                nro_operacion: nro_operacion + 1,
                                nro_transaccion: nro_operacion + 1,
                                nro_transaccion_dia: nro_operacion_dia + 1,
                                fecha_hora_operacion: Date.now(),
                                id_cliente: transferencia.solicitante_id_cliente, //BODY
                                cliente_razon_social: transferencia.beneficiario_razon_social, //BODY
                                oficina_origen_codigo: usuario.oficina_codigo,
                                caja_codigo: tokenDecodificado.idc,
                                fecha_trabajo: caja.fecha_trabajo,
                                cuenta_codigo: req.body.cuenta_codigo, ///?????										//BODY
                                codigo_validador: req.body.codigo_validador, //??									//BODY
                                concepto: req.body.concepto, ////??																//BODY
                                tipo_cambio: 0, //BODY
                                moneda1_Ingre: transferencia.moneda == 1 ? parseFloat(transferencia.importe) : 0, //???suma de valores?????? //BODY
                                moneda1_Egre: 0, //?suma de valores??????			//BODY
                                moneda2_Ingre: transferencia.moneda == 2 ? parseFloat(transferencia.importe) : 0,
                                moneda2_Egre: 0,
                                moneda3_Ingre: 0,
                                moneda3_Egre: 0,
                                modulo: "Anulacion",
                                usuario: tokenDecodificado.id,
                                estado_registro: 4
                              },
                              {
                                transaction: t
                              }
                            )
                            .then(op_Caja => {
                              op_caja = op_Caja;
                              return models.recibo_interno
                                .create(
                                  {
                                    recibo_doc_codigo: op_Caja.documento_codigo,
                                    recibo_doc_serie: op_Caja.documento_serie,
                                    recibo_nro: op_Caja.nro_operacion,
                                    recibo_tipo: "INGRESO", // INGRESO EGRESO
                                    recibo_finalidad: "EXTORNO", //INTERNO HABILITACION HABILITADO EXTORNO
                                    cuenta_codigo: req.body.cuenta_codigo, // EXTORNO
                                    id_cliente: transferencia.solicitante_id_cliente, //no hay en la trnasferncia
                                    razon_social: transferencia.solicitante_razon_social,
                                    recibo_concepto:
                                      "EXTORNO: " +
                                      transferencia.St_documento_codigo +
                                      "-" +
                                      transferencia.St_documento_serie +
                                      "-" +
                                      transferencia.nro_Solicitud, //ANULACION DE ST-....
                                    moneda: transferencia.moneda,
                                    importe: transferencia.importe, //suma de valores DEPENDE
                                    recibo_obs: req.body.concepto,
                                    recibo_fecha_hora: Date.now(),
                                    estado_registro: 4,
                                    anulacion_doc_codigo: transferencia.St_documento_codigo,
                                    anulacion_doc_serie: transferencia.St_documento_serie,
                                    anulacion_recibo_nro: transferencia.nro_Solicitud
                                  },
                                  {
                                    transaction: t
                                  }
                                )
                                .then(recibo_interno => {
                                  //ACTUALIZA EL ESTADO DE LA TRANSFERENCIA A ANULADO
                                  return models.transferencia.update(
                                    {
                                      st_estado: 1,
                                      autorizacion_estado: false,
                                      solicitud_obs:
                                        `EXTORNO:${req.body.anulacion_motivo}-` + transferencia.solicitud_obs ? transferencia.solicitud_obs : ""
                                    },
                                    {
                                      where: {
                                        St_documento_codigo: req.body.St_documento_codigo,
                                        St_documento_serie: req.body.St_documento_serie,
                                        nro_Solicitud: req.body.nro_Solicitud
                                      },
                                      transaction: t
                                    }
                                  );
                                });
                            });
                        });
                    });
                });
            })
            .then(result => {
              res.json({
                fecha_hora_operacion: op_caja.fecha_hora_operacion
              });
              // Transaction has been committed
              // result is whatever the result of the promise chain returned to the transaction callback
            })
            .catch(err => {
              logger.log("error", {
                ubicacion: filename,
                token: token,
                message: { mensaje: err.message, tracestack: err.stack }
              });
              res.status(412).send(err.message);
              // Transaction has been rolled back
              // err is whatever rejected the promise chain returned to the transaction callback
            });
        });
      });
    });
  } else {
    res.status(409).send("Ingrese un motivo de extorno");
  }
};

exports.buscar = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  let nro_Solicitud = {};
  if (parseInt(req.params.query)) {
    nro_Solicitud = {
      nro_Solicitud: parseInt(req.params.query)
    };
  }
  if (req.params.query === "*") {
    res.status(412).send("Campo de busqueda incorrecto");
    return;
  }

  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      models.sequelize
        .query(
          `SELECT * ` +
            `FROM buscar_transferencias(` +
            `nombre_beneficiario:= :nombre , ` +
            `estado:= :estado, ` +
            `fecha_inicio:= :fechai, ` +
            `fecha_fin:= :fechaf, ` +
            `oficina_destino:= :oficina_destino` +
            `)`,
          {
            replacements: {
              nombre: req.params.query,
              estado: 1,
              fechai: req.params.fechaInicio,
              fechaf: req.params.fechaFin,
              oficina_destino: usuario.oficina_codigo
            },
            type: models.sequelize.QueryTypes.SELECT,
            nest: true
          }
        )
        .then(transferencias => {
          res.json(transferencias);
        })
        .catch(err => {
          logger.log("error", {
            ubicacion: filename,
            token: token,
            message: { mensaje: err.message, tracestack: err.stack }
          });
          res.status(409).send("No se puede listar");
        });
    });
  });
};

exports.buscarBancos = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  let nro_Solicitud = {};
  if (parseInt(req.params.query)) {
    nro_Solicitud = {
      nro_Solicitud: parseInt(req.params.query)
    };
  }
  let estado = 0;
  if (req.params.estado != "*") {
    estado = req.params.estado;
  }

  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      models.sequelize
        .query(
          `SELECT * ` +
            `FROM buscar_transferencias(` +
            `nombre_beneficiario:= :nombre , ` +
            `estado:= :estado, ` +
            `fecha_inicio:= :fechai, ` +
            `fecha_fin:= :fechaf, ` +
            `oficina_destino:= :oficina_destino, ` +
            `bancos:= :bancos, ` +
            `codigoBanco:= :codigoBanco)`,
          {
            replacements: {
              nombre: req.params.query,
              fechai: req.params.fechaInicio,
              fechaf: req.params.fechaFin,
              oficina_destino: usuario.oficina_codigo,
              bancos: true,
              codigoBanco: req.params.codigo_banco,
              estado: estado
            },
            type: models.sequelize.QueryTypes.SELECT,
            nest: true
          }
        )
        .then(transferencias => {
          res.json(transferencias);
        })
        .catch(err => {
          logger.log("error", {
            ubicacion: filename,
            token: token,
            message: { mensaje: err.message, tracestack: err.stack }
          });
          res.status(409).send("No se puede listar");
        });
    });
  });
};

exports.buscarFotos = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  let oficinaOrigen = {};
  let oficinaDestino = {};
  let estado = {};
  let beneficiario_razon_social = {};
  if (req.params.oficina_origen !== "*") {
    oficinaOrigen = { oficina_codigo_origen: req.params.oficina_origen };
  }
  if (req.params.oficina_destino !== "*") {
    oficinaDestino = { oficina_codigo_destino: req.params.oficina_destino };
  }
  if (req.params.estado !== "*") {
    estado = {
      foto: req.params.estado === "pendiente" ? false : req.params.estado === "verificado" ? true : null
    };
  }
  if (req.params.query !== "*") {
    beneficiario_razon_social = {
      beneficiario_razon_social: {
        [Op.iLike]: `%${req.params.query.replace(/[^a-z\d\-_ñÑáéíóúÁÉÍÓÚ\s]+|$/i, "")}%`
      }
    };
  }

  models.transferencia
    .findAll({
      attributes: [
        "St_documento_codigo",
        "St_documento_serie",
        "nro_Solicitud",
        "op_documento_codigo",
        "op_documento_serie",
        "op_nro_operacion",
        "op_observacion",
        "op_fecha_hora",
        "op_usuario",
        "oficina_codigo_origen",
        "oficina_codigo_destino",
        "solicitud_fecha_hora",
        "beneficiario_docident",
        "beneficiario_id_cliente",
        "beneficiario_razon_social",
        "solicitante_id_cliente",
        "solicitante_razon_social",
        "moneda",
        "importe",
        "comision_dt",
        "comision_banco",
        "beneficiario_nro_celular",
        "solicitante_nro_celular",
        "solicitud_obs",
        "solicitud_fecha_hora",
        "st_estado",
        "st_autorizada",
        "tipo_giro",
        "foto",
        "importe_pagado"
      ],
      where: {
        ...oficinaOrigen,
        ...oficinaDestino,
        ...estado,
        ...beneficiario_razon_social,
        op_fecha_hora: {
          [Op.between]: [
            moment(req.params.fechaInicio, "YYYY-MM-DD")
              .startOf("day")
              .format(),
            moment(req.params.fechaFin, "YYYY-MM-DD")
              .endOf("day")
              .format()
          ]
        },
        ...[Sequelize.literal(`case when ${req.params.importe} = 0 then true else importe >= ${req.params.importe} end`)]
        
      },
      include: [
        {
          attributes: ["oficina_codigo", "oficina_nombre"],
          as: "oficinaOrigen",
          model: models.oficina,
          required: false
        },
        {
          attributes: ["oficina_codigo", "oficina_nombre"],
          as: "oficinaDestino",
          model: models.oficina,
          required: false
        }
      ]
    })
    .then(objeto => {
      if (objeto) {
        res.json(objeto);
      } else {
        res.status(409).send("Giro no encontrado");
      }
    })
    .catch(err => {
      logger.log("error", {
        ubicacion: filename,
        token: token,
        message: { mensaje: err.message, tracestack: err.stack }
      });
      res.status(409).send("error");
    });
};

exports.buscarcentral = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  models.sequelize
    .query(
      `SELECT * ` +
        `FROM buscar_transferencias(` +
        `nombre_beneficiario:= :nombre , ` +
        `estado:= :estado, ` +
        `fecha_inicio:= :fechai, ` +
        `fecha_fin:= :fechaf, ` +
        `oficina_origen:= :of_origen, ` +
        `oficina_destino:= :of_destino` +
        `)`,
      {
        replacements: {
          nombre: req.params.query,
          estado: req.params.estado === "*" ? 0 : req.params.estado,
          fechai: req.params.fechaInicio,
          fechaf: req.params.fechaFin,
          of_origen: req.params.oficina_origen,
          of_destino: req.params.oficina_destino
        },
        type: models.sequelize.QueryTypes.SELECT,
        nest: true
      }
    )
    .then(transferencias => {
      res.json(JSON.parse(JSON.stringify(transferencias)));
    })
    .catch(err => {
      logger.log("error", {
        ubicacion: filename,
        token: token,
        message: { mensaje: err.message, tracestack: err.stack }
      });
      res.status(409).send("No se puede listar");
    });
};

exports.buscarIdOficina = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      models.transferencia
        .findOne({
          attributes: [
            "St_documento_codigo",
            "St_documento_serie",
            "nro_Solicitud",
            "oficina_codigo_origen",
            "oficina_codigo_destino",
            "solicitud_fecha_hora",
            "beneficiario_docident",
            "beneficiario_id_cliente",
            "beneficiario_razon_social",
            "solicitante_id_cliente",
            "solicitante_razon_social",
            "moneda",
            "importe",
            "beneficiario_nro_celular",
            "solicitante_nro_celular",
            "solicitud_obs",
            "solicitud_fecha_hora",
            "st_estado",
            "comision_dt",
            "st_autorizada",
            "tipo_giro"
          ],
          where: {
            oficina_codigo_origen: req.params.oficina_codigo,
            nro_Solicitud: req.params.nro_operacion
          },
          include: [
            {
              attributes: ["oficina_codigo", "oficina_nombre"],
              as: "oficinaOrigen",
              model: models.oficina,
              required: false
            },
            {
              attributes: ["oficina_codigo", "oficina_nombre"],
              as: "oficinaDestino",
              model: models.oficina,
              required: false
            },
            {
              as: "beneficiario",
              attributes: ["fecha_nacimiento", "sexo"],
              model: models.cliente_proveedor,
              required: false
            }
          ]
        })
        .then(objeto => {
          if (objeto) {
            res.json(objeto);
          } else {
            res.status(409).send("Giro no encontrada");
          }
        })
        .catch(err => {
          logger.log("error", {
            ubicacion: filename,
            token: token,
            message: { mensaje: err.message, tracestack: err.stack }
          });
          res.json({
            error: err.errors
          });
        });
    });
  });
};

exports.buscarTransferencia = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      models.transferencia
        .findOne({
          attributes: [
            "St_documento_codigo",
            "St_documento_serie",
            "nro_Solicitud",
            "anulacion_motivo",
            "anulacion_usuario",
            "anulacion_fecha_hora",
            "oficina_codigo_origen",
            "oficina_codigo_destino",
            "solicitud_fecha_hora",
            "beneficiario_docident",
            "beneficiario_id_cliente",
            "beneficiario_razon_social",
            "solicitante_id_cliente",
            "solicitante_razon_social",
            "moneda",
            "importe",
            "beneficiario_nro_celular",
            "solicitante_nro_celular",
            "solicitud_obs",
            "solicitud_fecha_hora",
            "st_estado",
            "comision_dt",
            "comision_banco",
            "gastos_administrativos",
            "deposito_tipo",
            "deposito_destino",
            "deposito_nro_cuenta",
            "deposito_nro_operacion",
            "st_autorizada",
            "tipo_giro"
          ],
          where: {
            St_documento_codigo: req.params.St_documento_codigo,
            St_documento_serie: req.params.St_documento_serie,
            nro_Solicitud: req.params.nro_Solicitud
          },
          include: [
            {
              attributes: ["oficina_codigo", "oficina_nombre"],
              as: "oficinaOrigen",
              model: models.oficina,
              required: false
            },
            {
              attributes: ["oficina_codigo", "oficina_nombre"],
              as: "oficinaDestino",
              model: models.oficina,
              required: false
            },
            {
              as: "beneficiario",
              attributes: ["fecha_nacimiento", "sexo"],
              model: models.cliente_proveedor,
              required: false
            },
            {
              as: "banco",
              model: models.entidad_financiera_servicios,
              required: false
            }
          ]
        })
        .then(transferencia => {
          models.documento_serie
            .findOne({
              attributes: ["formato"],
              where: {
                documento_codigo: req.params.St_documento_codigo,
                documento_serie: req.params.St_documento_serie
              }
            })
            .then(formato => {
              if (transferencia) {
                transferencia.dataValues["formato"] = formato.formato;
                res.json(transferencia);
              } else {
                res.status(409).send("Giro no encontrada");
              }
            });
        })
        .catch(err => {
          logger.log("error", {
            ubicacion: filename,
            token: token,
            message: { mensaje: err.message, tracestack: err.stack }
          });
          res.json({
            error: err.errors
          });
        });
    });
  });
};

exports.buscarOrdenPago = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      models.transferencia
        .findOne({
          attributes: [
            "St_documento_codigo",
            "St_documento_serie",
            "nro_Solicitud",
            "op_documento_codigo",
            "op_documento_serie",
            "op_nro_operacion",
            "op_fecha_hora",
            "oficina_codigo_origen",
            "oficina_codigo_destino",
            "solicitud_fecha_hora",
            "beneficiario_docident",
            "beneficiario_id_cliente",
            "beneficiario_razon_social",
            "solicitante_id_cliente",
            "solicitante_razon_social",
            "moneda",
            "importe",
            "beneficiario_nro_celular",
            "solicitante_nro_celular",
            "solicitud_obs",
            "solicitud_fecha_hora",
            "st_estado",
            "comision_dt",
            "st_autorizada",
            "tipo_giro",
            "op_observacion"
          ],
          where: {
            op_documento_codigo: req.params.op_documento_codigo,
            op_documento_serie: req.params.op_documento_serie,
            op_nro_operacion: req.params.op_nro_operacion
            //oficina_codigo_destino:usuario.oficina_codigo
          },
          include: [
            {
              attributes: ["oficina_codigo", "oficina_nombre"],
              as: "oficinaOrigen",
              model: models.oficina,
              required: false
            },
            {
              attributes: ["oficina_codigo", "oficina_nombre"],
              as: "oficinaDestino",
              model: models.oficina,
              required: false
            },
            {
              as: "beneficiario",
              attributes: ["fecha_nacimiento", "sexo"],
              model: models.cliente_proveedor,
              required: false
            }
          ]
        })
        .then(objeto => {
          if (objeto) {
            res.json(objeto);
          } else {
            res.status(409).send("Giros no encontrados");
          }
        })
        .catch(err => {
          logger.log("error", {
            ubicacion: filename,
            token: token,
            message: { mensaje: err.message, tracestack: err.stack }
          });
          res.json({
            error: err.errors
          });
        });
    });
  });
};

exports.buscarPorIdOrdenPago = (req, res) => {
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
            modulo: "Ordenpago",
            estado_registro: true
          }
        })
        .then(documentoSerie => {
          models.transferencia
            .findOne({
              attributes: [
                "St_documento_codigo",
                "St_documento_serie",
                "nro_Solicitud",
                "op_documento_codigo",
                "op_documento_serie",
                "op_nro_operacion",
                "oficina_codigo_origen",
                "oficina_codigo_destino",
                "solicitud_fecha_hora",
                "beneficiario_docident",
                "beneficiario_id_cliente",
                "beneficiario_razon_social",
                "solicitante_id_cliente",
                "solicitante_razon_social",
                "moneda",
                "importe",
                "beneficiario_nro_celular",
                "solicitante_nro_celular",
                "solicitud_obs",
                "solicitud_fecha_hora",
                "st_estado",
                "comision_dt",
                "st_autorizada",
                "tipo_giro"
              ],
              where: {
                op_documento_codigo: documentoSerie.documento_codigo,
                op_documento_serie: documentoSerie.documento_serie,
                op_nro_operacion: req.params.op_nro_operacion
                //oficina_codigo_destino:usuario.oficina_codigo
              },
              include: [
                {
                  attributes: ["oficina_codigo", "oficina_nombre"],
                  as: "oficinaOrigen",
                  model: models.oficina,
                  required: false
                },
                {
                  attributes: ["oficina_codigo", "oficina_nombre"],
                  as: "oficinaDestino",
                  model: models.oficina,
                  required: false
                },
                {
                  as: "beneficiario",
                  attributes: ["fecha_nacimiento", "sexo"],
                  model: models.cliente_proveedor,
                  required: false
                }
              ]
            })
            .then(objeto => {
              if (objeto) {
                res.json(objeto);
              } else {
                res.status(409).send("Giro no encontrado");
              }
            })
            .catch(err => {
              err;
              logger.log("error", {
                ubicacion: filename,
                token: token,
                message: { mensaje: err.message, tracestack: err.stack }
              });
              res.status(409).send("error");
            });
        });
    });
  });
};

exports.listarAutorizados = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      models.sequelize
        .query(`SELECT * FROM listar_autorizados(:cod_oficina_buscar)`, {
          replacements: {
            cod_oficina_buscar: usuario.oficina_codigo
          },
          type: models.sequelize.QueryTypes.SELECT,
          nest: true
        })
        .then(listaAutorizadas => {
          res.json(listaAutorizadas);
        })
        .catch(err => {
          logger.log("error", {
            ubicacion: filename,
            token: token,
            message: { mensaje: err.message, tracestack: err.stack }
          });
          res.json({
            error: err.errors
          });
        });
    });
  });
};

exports.listarPor = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.transferencia
    .findAll({
      where: {
        oficina_codigo_origen: req.params.oficina_codigo || req.query.oficina_codigo_origen
      }
    })
    .then(lista => {
      res.json(lista);
    })
    .catch(err => {
      logger.log("error", {
        ubicacion: filename,
        token: token,
        message: { mensaje: err.message, tracestack: err.stack }
      });
      res.json({
        error: err.errors
      });
    });
};

exports.listarPendientes = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.transferencia
    .findAll({
      where: {
        st_estado: 1
      },
      include: [
        {
          model: models.oficina,
          attributes: ["oficina_nombre"],
          as: "oficinaOrigen"
        },
        {
          model: models.oficina,
          attributes: ["oficina_nombre"],
          as: "oficinaDestino"
        }
      ]
    })
    .then(lista => {
      res.json(lista);
    })
    .catch(err => {
      logger.log("error", {
        ubicacion: filename,
        token: token,
        message: { mensaje: err.message, tracestack: err.stack }
      });
      res.json({
        error: err.errors
      });
    });
};

exports.listarPagados = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.transferencia
    .findAll({
      where: {
        st_estado: 2
      },
      include: [
        {
          model: models.oficina,
          attributes: ["oficina_nombre"],
          as: "oficinaOrigen"
        },
        {
          model: models.oficina,
          attributes: ["oficina_nombre"],
          as: "oficinaDestino"
        }
      ]
    })
    .then(lista => {
      res.json(lista);
    })
    .catch(err => {
      logger.log("error", {
        ubicacion: filename,
        token: token,
        message: { mensaje: err.message, tracestack: err.stack }
      });
      res.json({
        error: err.errors
      });
    });
};

exports.listarAnulados = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.transferencia
    .findAll({
      where: {
        st_estado: 3
      },
      include: [
        {
          model: models.oficina,
          attributes: ["oficina_nombre"],
          as: "oficinaOrigen"
        },
        {
          model: models.oficina,
          attributes: ["oficina_nombre"],
          as: "oficinaDestino"
        }
      ]
    })
    .then(lista => {
      res.json(lista);
    })
    .catch(err => {
      logger.log("error", {
        ubicacion: filename,
        token: token,
        message: { mensaje: err.message, tracestack: err.stack }
      });
      res.json({
        error: err.errors
      });
    });
};

exports.listarExtornados = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.sequelize
    .query(
      `select * from transferencia, oficina 
				WHERE st_estado = 4 AND
					oficina_codigo_origen = oficina_codigo;`,
      {
        type: models.sequelize.QueryTypes.SELECT
      }
    )
    /*models.transferencia
		.findAll({
			where: {
				st_estado: 4,
			},
			include: [{
				model: models.oficina,
				as: "oficinaOrigen"
			},
			{
				model: models.oficina,
				as: "oficinaDestino"
			},
			{
				model : models.operacion_caja,
				as: "operacion_caja",
				where: {
					nro_operacion : nro_solicitud
				}
			},
			]
		})*/
    .then(lista => {
      res.json(lista);
    })
    .catch(err => {
      logger.log("error", {
        ubicacion: filename,
        token: token,
        message: { mensaje: err.message, tracestack: err.stack }
      });
      res.json({
        error: err.errors
      });
    });
};

exports.listarPagadasdelDia = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      //OBTENER DATOS DE CAJA DESDE REDIS
      redis.get(tokenDecodificado.idc, (err, caja) => {
        caja = JSON.parse(caja);

        models.transferencia
          .findAll({
            attributes: ["op_documento_codigo", "op_documento_serie", "op_nro_operacion", "beneficiario_razon_social", "foto"],
            where: {
              st_estado: 2,
              op_usuario: tokenDecodificado.id
            },
            order: [
              ["foto", "DESC"],
              ["op_nro_operacion", "ASC"]
            ],
            include: [
              {
                model: models.oficina,
                attributes: ["oficina_nombre"],
                as: "oficinaOrigen"
              },
              {
                model: models.oficina,
                attributes: ["oficina_nombre"],
                as: "oficinaDestino"
              }
            ]
          })
          .then(lista => {
            res.json(lista);
          })
          .catch(err => {
            logger.log("error", {
              ubicacion: filename,
              token: token,
              message: { mensaje: err.message, tracestack: err.stack }
            });
            res.json({
              error: err.errors
            });
          });
      });
    });
  });
};

exports.buscarPagadaporid = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      var in_nro_operacion = req.params.in_nro_operacion;
      //OBTENER DATOS DE CAJA DESDE REDIS
      redis.get(tokenDecodificado.idc, (err, caja) => {
        caja = JSON.parse(caja);

        models.transferencia
          .findAll({
            attributes: ["op_documento_codigo", "op_documento_serie", "op_nro_operacion", "beneficiario_razon_social", "foto"],
            where: {
              st_estado: 2,
              op_usuario: tokenDecodificado.id,
              op_nro_operacion: in_nro_operacion
            },
            include: [
              {
                model: models.oficina,
                attributes: ["oficina_nombre"],
                as: "oficinaOrigen"
              },
              {
                model: models.oficina,
                attributes: ["oficina_nombre"],
                as: "oficinaDestino"
              }
            ]
          })
          .then(lista => {
            res.json(lista);
          })
          .catch(err => {
            logger.log("error", {
              ubicacion: filename,
              token: token,
              message: { mensaje: err.message, tracestack: err.stack }
            });
            res.json({
              error: err.errors
            });
          });
      });
    });
  });
};

exports.guardarimagen = (req, res) => {
  upload(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      res.status(409).send("error en multer");
    } else if (err) {
      // An unknown error occurred when uploading.
      res.status(409).send("error al cargar la imagen");
    } else {
      models.transferencia
        .update(
          {
            foto: false
          },
          {
            where: {
              op_documento_codigo: req.body.op_documento_codigo,
              op_documento_serie: req.body.op_documento_serie,
              op_nro_operacion: req.body.op_nro_operacion
            }
          }
        )
        .then(resp => {
          res.json();
        });
    }
  });
};

exports.verificarfoto = (req, res) => {
  const token = req.header("Authorization").split(" ")[1];
  var logger = req.app.get("winston");
  models.transferencia
    .update(
      {
        foto: true
      },
      {
        where: {
          op_documento_codigo: req.body.op_documento_codigo,
          op_documento_serie: req.body.op_documento_serie,
          op_nro_operacion: req.body.op_nro_operacion
        }
      }
    )
    .then(resp => {
      res.json("correcto");
    })
    .catch(err => {
      res.status(409).send("No se puede verificar");
      logger.log("error", {
        ubicacion: filename,
        token: token,
        message: { mensaje: err.message, tracestack: err.stack }
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

function crearTransferencia(req) {
  return new Promise((resolve, reject) => {
    var redis = req.app.get("redis");
    const token = req.header("Authorization").split(" ")[1];
    var logger = req.app.get("winston");
    var socket = req.app.get("socketio");

    utils.decodeToken(token, tokenDecodificado => {
      //OBTENER DATOS DEL USUARIO DESDE REDIS
      redis.get(tokenDecodificado.id, (err, usuario) => {
        usuario = JSON.parse(usuario);

        if (req.body.tipo_giro == "Intercambio") {
          const hoy1 = moment().format("DD/MM/YYYY hh:mm");//19/03/2020 17:36
          const hoy2 = moment()
            .subtract(1, "minutes")
            .format("DD/MM/YYYY hh:mm");//19/03/2020 17:35

          let hashcalculado1 = hash([key.tokenIntercambio, hoy1]);//kaj8asba9sf98af9ab987asa3ata43fa434g
          let hashcalculado2 = hash([key.tokenIntercambio, hoy2]);//a4afa343afwawea434qaefas344tafa434af

          const ofOrigen = usuario.oficina_codigo;
          const ofDestino = req.body.oficina_codigo_destino;
          const cod1 = hash([hashcalculado1, ofOrigen, ofDestino])//jahgfda9pfa8sdfhgbas7ud65rfaytdt4a576agu8
            .replace(/[a-z]+/gi, "")//798413249878
            .substring(0, 6);//798413
          const cod2 = hash([hashcalculado2, ofOrigen, ofDestino])//lsikajhfkiuagskjdhfgakuiysgdlauiysgu
            .replace(/[a-z]+/gi, "")//12398416798
            .substring(0, 6);//123984

          if (cod1 != req.body.cod_validacion && cod2 != req.body.cod_validacion) {
            reject(Error("Codigo de validacion incorrecto"));
            return;
          }
        }

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
                        /**
                         * SOLO SE USA SI SE PROPORCIONA UN ID CLIENTE QUE NO EXISTE EN LA BD
                         */
                        const cliente = await models.cliente_proveedor.findByPk(req.body.beneficiario_docident);
                        let beneficiario_id_cliente = {};
                        let id_cliente = {};
                        if (cliente !== null) {
                          beneficiario_id_cliente = {
                            beneficiario_id_cliente: req.body.beneficiario_docident
                          };
                          id_cliente = {
                            id_cliente: req.body.beneficiario_docident
                          };
                        }
                        /************************************************************ */
                        return models.operacion_caja
                          .create(
                            {
                              documento_codigo: req.body.documento_codigo, //BODY
                              documento_serie: req.body.documento_serie, //BODY
                              nro_operacion: nro_operacion + 1,
                              nro_transaccion: nro_operacion + 1,
                              nro_transaccion_dia: nro_operacion_dia + 1,
                              fecha_hora_operacion: Date.now(),
                              ...id_cliente,
                              //id_cliente: req.body.solicitante_docident,
                              cliente_razon_social: req.body.solicitante_razon_social, //BODY
                              oficina_origen_codigo: usuario.oficina_codigo,
                              caja_codigo: tokenDecodificado.idc,
                              fecha_trabajo: caja.fecha_trabajo,
                              cuenta_codigo: req.body.cuenta_codigo, ///?????										//BODY
                              codigo_validador: req.body.codigo_validador, //??									//BODY
                              concepto: `Pago por envio a ${req.body.beneficiario_razon_social}`, ////??																//BODY
                              tipo_cambio: 0, //BODY
                              moneda1_Ingre:
                                req.body.moneda == 1
                                  ? parseFloat(req.body.comision_dt) +
                                    parseFloat(req.body.importe) +
                                    (req.body.gastos_administrativos ? parseFloat(req.body.gastos_administrativos) : 0)+
                                    (req.body.comision_banco ? parseFloat(req.body.comision_banco) : 0)
                                  : 0, //???suma de valores?????? //BODY
                              moneda1_Egre: 0, //?suma de valores??????			//BODY
                              moneda2_Ingre:
                                req.body.moneda == 2
                                  ? parseFloat(req.body.comision_dt) +
                                    parseFloat(req.body.importe) +
                                    (req.body.gastos_administrativos ? parseFloat(req.body.gastos_administrativos) : 0)+
                                    (req.body.comision_banco ? parseFloat(req.body.comision_banco) : 0)
                                  : 0,
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
                            let deposito_nro_operacion = {};
                            if (req.body.tipo_giro === "Servicios") {
                              deposito_nro_operacion = { deposito_nro_operacion: req.body.deposito_nro_operacion };
                            }
                            return models.transferencia.create(
                              {
                                St_documento_codigo: op_Caja.documento_codigo,
                                St_documento_serie: op_Caja.documento_serie,
                                nro_Solicitud: op_Caja.nro_operacion,
                                oficina_codigo_origen: op_Caja.oficina_origen_codigo,
                                oficina_codigo_destino: req.body.oficina_codigo_destino,
                                solicitud_fecha_hora: Date.now(),
                                ...beneficiario_id_cliente,
                                beneficiario_razon_social: req.body.beneficiario_razon_social,
                                beneficiario_docident: req.body.beneficiario_docident,
                                beneficiario_otros_datos: req.body.beneficiario_otros_datos,
                                solicitante_id_cliente: req.body.solicitante_id_cliente,
                                solicitante_razon_social: req.body.solicitante_razon_social,
                                solicitante_otros_datos: req.body.solicitante_otros_datos,
                                moneda: req.body.moneda,
                                importe: parseFloat(req.body.importe),
                                comision_dt: parseFloat(req.body.comision_dt),
                                comision_banco: req.body.comision_banco,
                                gastos_administrativos: req.body.gastos_administrativos,
                                deposito_entidad_codigo: req.body.deposito_entidad_codigo,
                                deposito_nro_cuenta: req.body.deposito_nro_cuenta,
                                ...deposito_nro_operacion,
                                deposito_tipo: req.body.deposito_tipo,
                                deposito_destino: req.body.deposito_destino,
                                beneficiario_nro_celular: req.body.beneficiario_nro_celular,
                                solicitante_nro_celular: req.body.solicitante_nro_celular,
                                solicitud_obs: req.body.solicitud_obs,
                                solicitud_msj: req.body.solicitud_msj,
                                autorizacion_fecha_hora: req.body.autorizacion_fecha_hora,
                                autorizacion_usuario: req.body.autorizacion_usuario,
                                id_centro_poblado_destino: req.body.id_centro_poblado,
                                st_autorizada: req.body.st_autorizada,
                                st_estado: 1,
                                tipo_giro: req.body.tipo_giro
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
              /*
              const montoIngreso = getMontoNotificacion("INGRESO", redis);
              if(result.importe>=montoIngreso){
                socket.to("montoAlto").emit("montoAlto", {
                  oficina: result.oficina_origen_codigo,
                  importe: result.importe,
                  operacion: "Recaudacion de Giro"
                });
              }*/

              resolve(result);
              // Transaction has been committed
              // result is whatever the result of the promise chain returned to the transaction callback
            })
            .catch(err => {
              logger.log("error", {
                ubicacion: filename,
                token: token,
                message: { mensaje: err.message, tracestack: err.stack }
              });
              reject(err);
              // Transaction has been rolled back
              // err is whatever rejected the promise chain returned to the transaction callback
            });
        });
      });
    });
  });
}

function calcularMaxDT(cod_oficinaA, cod_oficinaB, importe) {
  return new Promise((resolve, reject) => {
    models.sequelize
      .query(
        `SELECT max("comision") as "comision", "tipo_comision" ` +
          `FROM "comision" ` +
          `WHERE ("oficina_codigo" = :oficina2 OR "oficina_codigo" = :oficina1) ` +
          `AND :importe BETWEEN "monto_minimo"  AND "monto_maximo" ` +
          `GROUP BY "tipo_comision" ` +
          `ORDER BY "comision" DESC ` +
          `LIMIT 1;`,
        {
          replacements: {
            importe: importe,
            oficina1: cod_oficinaA,
            oficina2: cod_oficinaB
          },
          type: models.sequelize.QueryTypes.SELECT
        }
      )
      .then(maxComision => {
        maxComision = maxComision[0];
        if (maxComision.tipo_comision == "PORCENTAJE") {
          resolve(Math.round((parseFloat(maxComision.comision) / 100) * importe * 10) / 10);
        } else {
          resolve(parseFloat(maxComision.comision));
        }
      });
  });
}

function getMontoNotificacion(estado, redis) {
  if (estado == "INGRESO") {
    redis.get("Notificacion_Monto_Ingreso", function(err, montoIngreso) {
      if (montoIngreso) {
        return montoIngreso;
      } else {
        return getMontoNotificacionBD(estado, redis);
      }
    });
  } else {
    redis.get("Notificacion_Monto_Egreso", function(err, montoEgreso) {
      if (montoEgreso) {
        return montoEgreso;
      } else {
        return getMontoNotificacionBD(estado, redis);
      }
    });
  }
}

async function getMontoNotificacionBD(estado, redis) {
  if (estado == "INGRESO") {
    const montoIngreso = await models.configuracion.findOne({
      where: {
        clave: "Notificacion_Monto_Ingreso"
      }
    });
    redis.set("Notificacion_Monto_Ingreso", parseFloat(montoIngreso.valor));
    return parseFloat(montoIngreso.valor);
  } else {
    const montoEgreso = await models.configuracion.findOne({
      where: {
        clave: "Notificacion_Monto_Egreso"
      }
    });
    redis.set("Notificacion_Monto_Egreso", parseFloat(montoEgreso.valor));
    return parseFloat(montoEgreso.valor);
  }
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
            "$perfil->lista_menus.nivel_acceso$": { [Op.gte]: 1 },
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
            "$perfil->lista_menus.nivel_acceso$": { [Op.gte]: 1 },
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
