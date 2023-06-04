const Sequelize = require("sequelize");
const models = require("../models");
const utils = require("../services/utils");
// import oficina from "../controllers/oficina";
// const fs = require("fs");
const moment = require("moment");
const Op = Sequelize.Op;
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
//NUEVA TRANSFERENCIA DESDE CENTRAL
exports.crearCentral = function(req, res, next) {
  var redis = req.app.get("redis");
  var socket = req.app.get("socketio");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, async (err, usuario) => {
      usuario = JSON.parse(usuario);
      const documentoSerie = await models.documento_serie.findOne({
        attributes: ["documento_codigo", "documento_serie"],
        where: {
          estado_registro: true,
          oficina_codigo: req.body.oficina_codigo_origen,
          modulo: "Transferencias",
          estado_registro: true
        }
      });
      if (documentoSerie == null) {
        res.status(409).send("Oficina no cuenta con documento para realizar un giro");
        return;
      }
      let caja_registro;
      let op_caja;
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
                    /*****************************************************************/
                    //verificar si existe el parametro usuario en la peticion

                    if (req.body.usuario) {
                      //si existe usuario buscar caja de usuario
                      const caja_oficina = await models.cuenta_usuario.findOne({
                        where: {
                          usuario: req.body.usuario,
                          estado_registro: true
                        },
                        include: [
                          {
                            attributes: ["caja_codigo", "caja_nombre"],
                            where: {
                              estado_registro: true
                            },
                            model: models.caja,
                            required: false,
                            include: [
                              {
                                attributes: ["oficina_nombre", "oficina_codigo"],
                                model: models.oficina,
                                required: false
                              }
                            ]
                          },
                          {
                            attributes: ["perfil_nombre"],
                            model: models.perfil,
                            required: false
                          }
                        ]
                      });

                      if (caja_oficina) {
                        if (caja_oficina.caja.oficina.oficina_codigo !== req.body.oficina_codigo_origen) {
                          throw new Error("El usuario ingresado no pertenece a la oficina origen");
                        } else {
                          caja_registro = caja_oficina;
                        }
                      } else {
                        throw new Error("El usuario no cuenta con una caja registrada o no existe");
                      }
                    } else {
                      //buscar caja de la oficina de origen
                      const cajas_oficina = await models.caja.findAll({
                        where: {
                          oficina_codigo: req.body.oficina_codigo_origen
                        }
                      });
                      if (cajas_oficina.length > 1) {
                        throw new Error("La oficina origen tiene mas de una caja, ingrese un usuario de caja");
                      } else if (cajas_oficina.length === 0) {
                        throw new Error("La oficina no cuenta con cajas registradas");
                      } else {
                        caja_registro = cajas_oficina[0];
                      }
                    }
                    /*****************************************************************/
                    let caja = await getCajaRedis(redis, caja_registro.caja_codigo, tokenDecodificado.id);

                    return models.operacion_caja
                      .create(
                        {
                          documento_codigo: documentoSerie.documento_codigo, //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                          documento_serie: documentoSerie.documento_serie, //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                          nro_operacion: nro_operacion + 1,
                          nro_transaccion: nro_operacion + 1,
                          nro_transaccion_dia: nro_operacion_dia + 1,
                          fecha_hora_operacion: Date.now(),
                          ...id_cliente,
                          caja_codigo: caja_registro.caja_codigo, //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                          fecha_trabajo: caja.fecha_trabajo, //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                          cliente_razon_social: req.body.solicitante_razon_social,
                          oficina_origen_codigo: req.body.oficina_codigo_origen, //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                          cuenta_codigo: req.body.cuenta_codigo,
                          codigo_validador: req.body.codigo_validador,
                          concepto: `Pago por envio a ${req.body.beneficiario_razon_social}`,
                          tipo_cambio: 0,
                          moneda1_Ingre:
                            req.body.moneda == 1
                              ? parseFloat(req.body.comision_dt) +
                                parseFloat(req.body.importe) +
                                (req.body.gastos_administrativos ? parseFloat(req.body.gastos_administrativos) : 0) +
                                (req.body.comision_banco ? parseFloat(req.body.comision_banco) : 0)
                              : 0,
                          moneda1_Egre: 0,
                          moneda2_Ingre:
                            req.body.moneda == 2
                              ? parseFloat(req.body.comision_dt) +
                                parseFloat(req.body.importe) +
                                (req.body.gastos_administrativos ? parseFloat(req.body.gastos_administrativos) : 0) +
                                (req.body.comision_banco ? parseFloat(req.body.comision_banco) : 0)
                              : 0,
                          moneda2_Egre: 0,
                          moneda3_Ingre: 0,
                          moneda3_Egre: 0,
                          modulo: req.body.tipo_giro,
                          usuario: tokenDecodificado.id,
                          registrado_central: true,
                          estado_registro: 1
                        },
                        {
                          transaction: t
                        }
                      )
                      .then(op_Caja => {
                        op_caja = op_Caja;
                        let deposito_nro_operacion = {};
                        if (req.body.tipo_giro === "Servicios") {
                          deposito_nro_operacion = { deposito_nro_operacion: req.body.deposito_nro_operacion };
                        }
                        return models.transferencia.create(
                          {
                            St_documento_codigo: op_Caja.documento_codigo,
                            St_documento_serie: op_Caja.documento_serie,
                            nro_Solicitud: op_Caja.nro_operacion,
                            oficina_codigo_origen: req.body.oficina_codigo_origen,
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
                            importe: req.body.importe,
                            comision_dt: req.body.comision_dt,
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
          
          let oficina_origen;
          let oficina_destino;
          models.sequelize
          .query(
            `select ofio.oficina_nombre as origen, ofid.oficina_nombre as destino
            from transferencia t left join oficina ofio on (t.oficina_codigo_origen = ofio.oficina_codigo) left join oficina ofid on (t.oficina_codigo_destino = ofid.oficina_codigo)
            where t."St_documento_codigo" = '${result.St_documento_codigo}' and t."St_documento_serie" = ${result.St_documento_serie} and t."nro_Solicitud" = ${result.nro_Solicitud}`,
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
              "GIRO",
              result.importe,
              `Giro registrado por central, monto: ${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(result.importe)}`,
              `Origen: ${oficina_origen} Destino: ${oficina_destino}`,
              `${result.St_documento_codigo}${result.St_documento_serie}-${result.nro_Solicitud}`,
              tokenDecodificado.id,
              caja_registro.caja_codigo
            );
          });

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
          res.status(412).send(err.message);
          // Transaction has been rolled back
          // err is whatever rejected the promise chain returned to the transaction callback
        });
    });
  });
};

exports.cancelarCentral = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  var socket = req.app.get("socketio");
  const token = req.header("Authorization").split(" ")[1];

  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, async (err, usuario) => {
      usuario = JSON.parse(usuario);
      const documentoSerie = await models.documento_serie.findOne({
        attributes: ["documento_codigo", "documento_serie"],
        where: {
          estado_registro: true,
          oficina_codigo: req.body.oficina_codigo_destino,
          modulo: "Ordenpago",
          estado_registro: true
        }
      });

      if (documentoSerie == null) {
        logger.log("warn", {
          ubicacion: filename,
          token: token,
          message: "Oficina destino no cuenta con documento para pagar giros"
        });
        res.status(409).send("Oficina destino no cuenta con documento para pagar giros");
        return;
      }
      //INICIA TRANSACCION
      let opCaja = null;
      let transferencia_origen;
      let caja_registro;
      let respuesta_oficina_nombre;
      return models.sequelize
        .transaction(t => {
          //PBTNER NUMERO DE OPERACION
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
                      transferencia_origen = transferencia;
                      
                      /*****************************************************************/
                      //verificar si existe el parametro usuario en la peticion

                      if (req.body.usuario) {
                        //si existe usuario buscar caja de usuario
                        const caja_oficina = await models.cuenta_usuario.findOne({
                          where: {
                            usuario: req.body.usuario
                          },
                          include: [
                            {
                              attributes: ["caja_codigo", "caja_nombre"],
                              model: models.caja,
                              required: false,
                              include: [
                                {
                                  attributes: ["oficina_nombre", "oficina_codigo"],
                                  model: models.oficina,
                                  required: false
                                }
                              ]
                            },
                            {
                              attributes: ["perfil_nombre"],
                              model: models.perfil,
                              required: false
                            }
                          ]
                        });
                        if (caja_oficina) {
                          if (caja_oficina.caja.oficina.oficina_codigo !== transferencia.oficina_codigo_destino) {
                            throw new Error("El usuario ingresado no pertenece a la oficina destino");
                          } else {
                            caja_registro = caja_oficina;
                          }
                        } else {
                          throw new Error("El usuario no cuenta con una caja registrada o no existe");
                        }
                      } else {
                        //buscar caja de la oficina de origen
                        const cajas_oficina = await models.caja.findAll({
                          where: {
                            oficina_codigo: transferencia.oficina_codigo_destino
                          }
                        });
                        if (cajas_oficina.length > 1) {
                          throw new Error("La oficina destino tiene mas de una caja, ingrese un usuario de caja");
                        } else if (cajas_oficina === 0) {
                          throw new Error("La oficina no cuenta con cajas registradas");
                        } else {
                          caja_registro = cajas_oficina[0];
                        }
                      }
                      let caja = await getCajaRedis(redis, caja_registro.caja_codigo, tokenDecodificado.id);
                      /*****************************************************************/
                      // Verificar saldo de caja (central si puede pagar aun con saldo negativo)
                      // Verificar estado de la transferencia
                      if (transferencia.st_estado === 2) {
                        throw new Error("Giro se encuentra cancelado");
                      } else if (transferencia.st_estado === 3) {
                        throw new Error("Giro se encuentra reembolsado");
                      } else if (transferencia.st_estado === 4) {
                        throw new Error("Giro se encuentra anulado");
                      }
                      //CREAR UNA OPERACION DE CAJA
                      let idCliente = {};
                      if (req.body.id_cliente != null && req.body.id_cliente != "") {
                        await models.cliente_proveedor
                          .findOne({
                            where: {
                              id_cliente: req.body.id_cliente
                            }
                          })
                          .then(cliente => {
                            if (cliente === null) {
                              utils.buscarDNI(req.body.id_cliente, respuesta => {
                                if (respuesta) {
                                  idCliente = { id_cliente: req.body.id_cliente };
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
                              idCliente = { id_cliente: req.body.id_cliente };

                              if (req.body.fecha_nacimiento || req.body.sexo) {
                                models.cliente_proveedor.update(
                                  {
                                    sexo: req.body.sexo,
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
                      }

                      //===========================================================================
                      
                      
                      //===========================================================================

                      return models.operacion_caja
                        .create(
                          {
                            documento_codigo: documentoSerie.documento_codigo, //BODY
                            documento_serie: documentoSerie.documento_serie, //BODY
                            nro_operacion: nro_operacion + 1,
                            nro_transaccion: nro_operacion + 1,
                            nro_transaccion_dia: nro_operacion_dia + 1,
                            fecha_hora_operacion: Date.now(),
                            ...idCliente, //BODY
                            caja_codigo: caja_registro.caja_codigo,
                            fecha_trabajo: caja.fecha_trabajo,
                            cliente_razon_social: transferencia.beneficiario_razon_social, //BODY
                            oficina_origen_codigo: transferencia.oficina_codigo_destino,
                            cuenta_codigo: req.body.cuenta_codigo, ///?????										//BODY
                            codigo_validador: req.body.codigo_validador, //??									//BODY
                            concepto: `Pago de ${transferencia.solicitante_razon_social}`, ////??
                            tipo_cambio: 0, //BODY
                            moneda1_Ingre: 0, //???suma de valores?????? //BODY
                            moneda1_Egre: transferencia.moneda == 1 ? transferencia.importe : 0, //?suma de valores??????			//BODY
                            moneda2_Ingre: 0,
                            moneda2_Egre: transferencia.moneda == 2 ? transferencia.importe : 0,
                            moneda3_Ingre: 0,
                            moneda3_Egre: 0,
                            modulo: "Op",
                            usuario: tokenDecodificado.id,
                            registrado_central: true,
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
                              beneficiario_docident: transferencia.beneficiario_docident ? transferencia.beneficiario_docident : req.body.id_cliente,
                              importe_pagado: req.body.importe_pagado,
                              op_usuario: tokenDecodificado.id,
                              op_documento_codigo: op_Caja.documento_codigo,
                              op_documento_serie: op_Caja.documento_serie,
                              op_nro_operacion: op_Caja.nro_operacion,
                              op_observacion: `DNI:${req.body.id_cliente || req.body.cod_validacion} | ` + req.body.concepto,
                              op_fecha_hora: Date.now(),
                              st_estado: 2,
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
        })
        .then(result => {
          let oficina_origen;
          let oficina_destino;
          models.sequelize
          .query(
            `select ofio.oficina_nombre as origen, ofid.oficina_nombre as destino
            from transferencia t left join oficina ofio on (t.oficina_codigo_origen = ofio.oficina_codigo) left join oficina ofid on (t.oficina_codigo_destino = ofid.oficina_codigo)
            where t."St_documento_codigo" = '${transferencia_origen.St_documento_codigo}' and t."St_documento_serie" = ${transferencia_origen.St_documento_serie} and t."nro_Solicitud" = ${transferencia_origen.nro_Solicitud}`,
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
              transferencia_origen.importe,
              `Giro pagado por central, monto: ${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(transferencia_origen.importe)}`,
              `Origen: ${oficina_origen} Destino: ${oficina_destino}`,
              `${opCaja.documento_codigo}${opCaja.documento_serie}-${opCaja.nro_operacion}`,
              tokenDecodificado.id,
              caja_registro.caja_codigo
            );
          });
          
          res.json({
            nro_operacion: opCaja.nro_operacion
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
};

//////////////////////////////////////////////////
exports.realizarAnulacion = (req, res) => {
  if (req.body.anulacion_motivo && req.body.anulacion_motivo !== "") {
    var socket = req.app.get("socketio");
    var redis = req.app.get("redis");
    var logger = req.app.get("winston");
    const token = req.header("Authorization").split(" ")[1];
    let opCajaAnulacion;
    let transferenciaOriginal;
    let transferencia_op_caja;
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
                  } else if (transferencia.tipo_giro === "Intercambio" && transferencia.st_autorizada != 1) {
                    throw new Error("Necesita autorizacion para anular un intercambio");
                  }

                  const documentoSerie = await models.documento_serie.findOne({
                    attributes: ["documento_codigo", "documento_serie"],
                    where: {
                      estado_registro: true,
                      oficina_codigo: transferencia.oficina_codigo_origen,
                      modulo: "Reciboegreso",
                      estado_registro: true
                    }
                  });
                  if (documentoSerie == null) {
                    throw new Error("Oficina no cuenta con documento de Recibo Egreso");
                  }
                  transferencia_op_caja = await models.operacion_caja.findOne({
                    where: {
                      documento_codigo: req.body.St_documento_codigo,
                      documento_serie: req.body.St_documento_serie,
                      nro_operacion: req.body.nro_Solicitud
                    }
                  });

                  //abrir caja en caso este cerrada y validar si esta abierta o cerrada
                  await getCajaRedis(redis, transferencia_op_caja.caja_codigo, tokenDecodificado.idc);

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
                                id_cliente: transferencia.solicitante_id_cliente, //BODY
                                cliente_razon_social: transferencia.solicitante_razon_social, //BODY
                                oficina_origen_codigo: transferencia.oficina_codigo_origen,
                                caja_codigo: transferencia_op_caja.caja_codigo,
                                fecha_trabajo: Date.now(),
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
                                registrado_central: true,
                                estado_registro: 4,
                                anulacion_doc_codigo: transferencia.St_documento_codigo,
                                anulacion_doc_serie: transferencia.St_documento_serie,
                                anulacion_recibo_nro: transferencia.nro_Solicitud
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
                                    estado_registro: 4
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
                where t."St_documento_codigo" = '${transferenciaOriginal.St_documento_codigo}' and t."St_documento_serie" = ${transferenciaOriginal.St_documento_serie} and t."nro_Solicitud" = ${transferenciaOriginal.nro_Solicitud}`,
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
                  transferenciaOriginal.importe,
                  `Giro anulado por central, monto: ${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(transferenciaOriginal.importe)}`,
                  `Origen: ${oficina_origen} Destino: ${oficina_destino}`,
                  `${opCajaAnulacion.documento_codigo}${opCajaAnulacion.documento_serie}-${opCajaAnulacion.nro_operacion}`,
                  tokenDecodificado.id,
                  transferencia_op_caja.caja_codigo
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
    var socket = req.app.get("socketio");
    var redis = req.app.get("redis");
    var logger = req.app.get("winston");
    const token = req.header("Authorization").split(" ")[1];
    let opCajaAnulacion;
    let transferencia_op_caja;
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
                    throw new Error("Giro ya fue cancelada");
                  } else if (transferencia.st_estado === 3) {
                    throw new Error("Giro ya fue reembolsado");
                  } else if (transferencia.st_estado === 4) {
                    throw new Error("Giro ya fue anulada");
                  } else if (transferencia.autorizacion_estado === false) {
                    throw new Error("Ya se realizo la devolucion del giro");
                  } else if (transferencia.st_autorizada !== 1) {
                    throw new Error("Usted no esta autorizado para realizar una devolucion");
                  }

                  const documentoSerie = await models.documento_serie.findOne({
                    attributes: ["documento_codigo", "documento_serie"],
                    where: {
                      estado_registro: true,
                      oficina_codigo: transferencia.oficina_codigo_origen,
                      modulo: "Reciboegreso",
                      estado_registro: true
                    }
                  });
                  if (documentoSerie == null) {
                    throw new Error("Oficina no cuenta con documento de Recibo Egreso");
                  }
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
                      transferencia_op_caja = await models.operacion_caja.findOne({
                        where: {
                          documento_codigo: req.body.St_documento_codigo,
                          documento_serie: req.body.St_documento_serie,
                          nro_operacion: req.body.nro_Solicitud
                        }
                      });

                      //abrir caja en caso este cerrada y validar si esta abierta o cerrada
                      await getCajaRedis(redis, transferencia_op_caja.caja_codigo, tokenDecodificado.idc);

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
                                id_cliente: transferencia.solicitante_id_cliente, //BODY
                                cliente_razon_social: transferencia.solicitante_razon_social, //BODY
                                oficina_origen_codigo: transferencia.oficina_codigo_origen,
                                caja_codigo: transferencia_op_caja.caja_codigo,
                                fecha_trabajo: Date.now(),
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
                                modulo: "Devolucion",
                                usuario: tokenDecodificado.id,
                                registrado_central: true,
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
                where t."St_documento_codigo" = '${transferenciaOriginal.St_documento_codigo}' and t."St_documento_serie" = ${transferenciaOriginal.St_documento_serie} and t."nro_Solicitud" = ${transferenciaOriginal.nro_Solicitud}`,
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
                  transferenciaOriginal.importe,
                  `Giro devuelto por central, monto: ${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(transferenciaOriginal.importe)}`,
                  `Origen: ${oficina_origen} Destino: ${oficina_destino}`,
                  `${opCajaAnulacion.documento_codigo}${opCajaAnulacion.documento_serie}-${opCajaAnulacion.nro_operacion}`,
                  tokenDecodificado.id,
                  transferencia_op_caja.caja_codigo
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
  if (req.body.anulacion_motivo && req.body.anulacion_motivo !== "") {
    var socket = req.app.get("socketio");
    var redis = req.app.get("redis");
    var logger = req.app.get("winston");
    const token = req.header("Authorization").split(" ")[1];
    let opCajaAnulacion;
    let transferenciaOriginal;
    let transferencia_op_caja;
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
                    throw new Error("Giro ya fue reembolsado");
                  } else if (transferencia.st_autorizada !== 2) {
                    throw new Error("Usted no esta autorizado para realizar un reembolso");
                  }

                  const documentoSerie = await models.documento_serie.findOne({
                    attributes: ["documento_codigo", "documento_serie"],
                    where: {
                      estado_registro: true,
                      oficina_codigo: transferencia.oficina_codigo_origen,
                      modulo: "Reciboegreso",
                      estado_registro: true
                    }
                  });
                  if (documentoSerie == null) {
                    throw new Error("Oficina no cuenta con documento de Recibo Egreso");
                  }
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

                      transferencia_op_caja = await models.operacion_caja.findOne({
                        where: {
                          documento_codigo: req.body.St_documento_codigo,
                          documento_serie: req.body.St_documento_serie,
                          nro_operacion: req.body.nro_Solicitud
                        }
                      });

                      //abrir caja en caso este cerrada y validar si esta abierta o cerrada
                      await getCajaRedis(redis, transferencia_op_caja.caja_codigo, tokenDecodificado.idc);

                      let nro_operacion;

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
                                id_cliente: transferencia.solicitante_id_cliente, //BODY
                                cliente_razon_social: transferencia.solicitante_razon_social, //BODY
                                oficina_origen_codigo: transferencia.oficina_codigo_origen,
                                caja_codigo: transferencia_op_caja.caja_codigo,
                                fecha_trabajo: Date.now(),
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
                                registrado_central: true,
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
                                      "REEMBOLSO: " +
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
                where t."St_documento_codigo" = '${transferenciaOriginal.St_documento_codigo}' and t."St_documento_serie" = ${transferenciaOriginal.St_documento_serie} and t."nro_Solicitud" = ${transferenciaOriginal.nro_Solicitud}`,
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
                  transferenciaOriginal.importe,
                  `Giro reembolsado por central, monto: ${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(
                    transferenciaOriginal.importe
                  )}`,
                  `Origen: ${oficina_origen} Destino: ${oficina_destino}`,
                  `${opCajaAnulacion.documento_codigo}${opCajaAnulacion.documento_serie}-${opCajaAnulacion.nro_operacion}`,
                  tokenDecodificado.id,
                  transferencia_op_caja.caja_codigo
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

exports.realizarCambioDestino = (req, res) => {
  if (req.body.anulacion_motivo && req.body.anulacion_motivo !== "") {
    var socket = req.app.get("socketio");
    var redis = req.app.get("redis");
    var logger = req.app.get("winston");
    const token = req.header("Authorization").split(" ")[1];
    let transferenciaLeida;
    let opCaja;
    let maxdt = 0;
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
                  transferenciaLeida = transferencia;
                  //VERIFICA SI LA TRANSFERENCIA YA FUE ANULADA O CANCELADA
                  if (transferencia.st_estado === 2) {
                    throw new Error("Giro ya fue cancelado");
                  } else if (transferencia.st_estado === 3) {
                    throw new Error("Giro ya fue reembolsado");
                  } else if (transferencia.st_estado === 4) {
                    throw new Error("Giro ya fue anulado");
                  } else if (transferencia.autorizacion_estado === false) {
                    throw new Error("Giro ya fue cambiada de destino");
                  } else if (transferencia.st_autorizada !== 3) {
                    throw new Error("Usted no esta autorizado para realizar un cambio de destino");
                  }

                  let comision_dt_calculado = await calcularMaxDT(
                    transferencia.oficina_codigo_origen,
                    req.body.oficina_codigo_destino,
                    transferencia.importe
                  );

                  let nuevo_importe = parseFloat(transferencia.importe);
                  let nueva_comision_dt = Math.floor((comision_dt_calculado / 2) * 10) / 10;
                  if (nueva_comision_dt !== req.body.gastos_administrativos) {
                    throw new Error("El monto de reintegro no es valido, actualize su Base de datos de DT's");
                  }

                  if (req.body.descontar_importe) {
                    nuevo_importe = nuevo_importe - nueva_comision_dt;
                  }

                  //buscar caja de operacion
                  opCaja = await models.operacion_caja.findOne({
                    where: {
                      documento_codigo: req.body.St_documento_codigo,
                      documento_serie: req.body.St_documento_serie,
                      nro_operacion: req.body.nro_Solicitud
                    }
                  });

                  return models.transferencia.update(
                    {
                      oficina_codigo_destino: req.body.oficina_codigo_destino,
                      importe: nuevo_importe,
                      gastos_administrativos: nueva_comision_dt,
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
                where t."St_documento_codigo" = '${transferenciaLeida.St_documento_codigo}' and t."St_documento_serie" = ${transferenciaLeida.St_documento_serie} and t."nro_Solicitud" = ${transferenciaLeida.nro_Solicitud}`,
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
                  "Cambio de destino",
                  transferenciaLeida.importe,
                  `Cambio de destino por central, monto ${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(transferenciaLeida.importe)}`,
                  `Origen: ${oficina_origen} Destino: ${oficina_destino}`,
                  `${transferenciaLeida.St_documento_codigo}${transferenciaLeida.St_documento_serie}-${transferenciaLeida.nro_Solicitud}`,
                  tokenDecodificado.id,
                  opCaja.caja_codigo
                );
              });
              
              res.json({ importe: parseFloat(transferenciaLeida.importe) - maxdt, fecha_hora_operacion: Date.now() });
            })
            .catch(err => {
              logger.log("error", { ubicacion: filename, token: token, message: err.message });
              res.status(412).send(err.message);
            });
        });
      });
    });
  } else {
    res.status(412).send("Ingrese un motivo de cambio de destino");
  }
};

exports.realizarCambioBeneficiario = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  var socket = req.app.get("socketio");
  let transferenciaOriginal;
  let opCaja;
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
                  throw new Error("Giro ya fue cambiado de beneficiario");
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
                //buscar caja de operacion
                opCaja = await models.operacion_caja.findOne({
                  where: {
                    documento_codigo: req.body.St_documento_codigo,
                    documento_serie: req.body.St_documento_serie,
                    nro_operacion: req.body.nro_Solicitud
                  }
                });
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
                `Cambio de beneficiario por central, monto: ${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(
                  transferenciaOriginal.importe
                )}`,
                `Origen: ${oficina_origen} Destino: ${oficina_destino}`,
                `${transferenciaOriginal.St_documento_codigo}${transferenciaOriginal.St_documento_serie}-${transferenciaOriginal.nro_Solicitud}`,
                tokenDecodificado.id,
                opCaja.caja_codigo
              );
            });
            
            res.json({
              nro_operacion: null
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

exports.realizarExtorno = (req, res) => {
  if (req.body.anulacion_motivo && req.body.anulacion_motivo !== "") {
    var redis = req.app.get("redis");
    var logger = req.app.get("winston");
    const token = req.header("Authorization").split(" ")[1];
    var socket = req.app.get("socketio");

    let opCajaAnulacion;
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
                  if (transferencia.st_estado === 1) {
                    throw new Error("Giro pendiente, no se puede extornar");
                  } else if (transferencia.st_estado === 3) {
                    throw new Error("Giro reembolsado, no puede ser extornado");
                  } else if (transferencia.st_estado === 4) {
                    throw new Error("Giro anulado, no puede ser extornado");
                  } else if (transferencia.autorizacion_estado === false) {
                    throw new Error("Giro ya fue extornado");
                  } else if (transferencia.st_autorizada !== 5) {
                    throw new Error("Usted no esta autorizado para realizar extorno");
                  }

                  const documentoSerie = await models.documento_serie.findOne({
                    attributes: ["documento_codigo", "documento_serie"],
                    where: {
                      estado_registro: true,
                      oficina_codigo: transferencia.oficina_codigo_destino,
                      modulo: "Reciboingreso"
                    }
                  });

                  if (documentoSerie == null) {
                    throw new Error("Oficina no cuenta con documento de Recibo Ingreso");
                  }
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
                      const transferencia_op_caja = await models.operacion_caja.findOne({
                        where: {
                          documento_codigo: transferencia.op_documento_codigo,
                          documento_serie: transferencia.op_documento_serie,
                          nro_operacion: transferencia.op_nro_operacion
                        }
                      });

                      //abrir caja en caso este cerrada y validar si esta abierta o cerrada
                      await getCajaRedis(redis, transferencia_op_caja.caja_codigo, tokenDecodificado.idc);

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
                                id_cliente: transferencia.solicitante_id_cliente, //BODY
                                cliente_razon_social: transferencia.solicitante_razon_social, //BODY
                                oficina_origen_codigo: transferencia.oficina_codigo_destino,
                                caja_codigo: transferencia_op_caja.caja_codigo,
                                fecha_trabajo: Date.now(),
                                cuenta_codigo: req.body.cuenta_codigo, ///?????										//BODY
                                codigo_validador: req.body.codigo_validador, //??									//BODY
                                concepto: req.body.anulacion_motivo, ////??																//BODY
                                tipo_cambio: 0, //BODY
                                moneda1_Ingre: 0, //???suma de valores?????? //BODY
                                moneda1_Egre: transferencia.moneda == 1 ? parseFloat(transferencia.importe) : 0, //?suma de valores??????			//BODY
                                moneda2_Ingre: 0,
                                moneda2_Egre: transferencia.moneda == 2 ? parseFloat(transferencia.importe) : 0,
                                moneda3_Ingre: 0,
                                moneda3_Egre: 0,
                                modulo: "Anulacion",
                                usuario: tokenDecodificado.id,
                                registrado_central: true,
                                estado_registro: 1
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
                                    importe: parseFloat(transferencia.importe),
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
    res.status(412).send("Ingrese un motivo de extorno");
  }
};

exports.listarTransferenciasCaja = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      //OBTENER DATOS DE CAJA DESDE REDIS
      models.sequelize
        .query(`select * from buscar_operaciones_central(:cajacodigo, :fechaTrabajo);`, {
          replacements: {
            cajacodigo: tokenDecodificado.idc,
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

exports.cambiooficinacentropoblado = (req, res) => {
  var socket = req.app.get("socketio");
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  let transferenciaLeida;
  let opCaja;
  let maxdt = 0;
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
                transferenciaLeida = transferencia;
                //VERIFICA SI LA TRANSFERENCIA YA FUE ANULADA O CANCELADA
                if (transferencia.st_estado === 2) {
                  throw new Error("Giro ya fue cancelado");
                } else if (transferencia.st_estado === 3) {
                  throw new Error("Giro ya fue reembolsado");
                } else if (transferencia.st_estado === 4) {
                  throw new Error("Giro ya fue anulado");
                }

                return models.transferencia.update(
                  {
                    oficina_codigo_destino: req.body.oficina_codigo_destino
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
            logger.log("error", { ubicacion: filename, token: token, message: err.message });
            res.status(412).send(err.message);
          });
      });
    });
  });
};

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
      redis.set(
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
        redis.set(
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

