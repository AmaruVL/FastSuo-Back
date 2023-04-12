const Sequelize = require("sequelize");
import services from "../services/utils";
import moment from "moment";
const models = require("../models");
const DeviceDetector = require("node-device-detector");
const DEVICE_TYPE = require("node-device-detector/parser/const/device-type");
var bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const key = require("../config/key");
import utils from "../services/utils";
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);
exports.crear = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.cuenta_usuario
    .create({
      usuario: req.body.usuario,
      contrasena: bcrypt.hashSync(req.body.contrasena, 8),
      usuario_nombre: req.body.usuario_nombre,
      pregunta_secreta: req.body.pregunta_secreta,
      respuesta: req.body.respuesta,
      contrasena_old: req.body.contrasena_old,
      estado_registro: req.body.estado_registro,
      empresa_codigo: req.body.empresa_codigo,
      pc_sn: req.body.pc_sn,
      caja_codigo: req.body.caja_codigo,
      perfil_codigo: req.body.perfil_codigo,
      puede_editar_DT: req.body.puede_editar_DT,
      modo_conexion: req.body.modo_conexion,
      tipo_arqueo: req.body.tipo_arqueo
    })
    .then(objeto => {
      res.json(objeto);
    })
    .catch(err => {
      logger.log("error", {
        ubicacion: filename,
        token: token,
        message: { mensaje: err.message, tracestack: err.stack }
      });
      res.status(412).send(err);
    });
};

exports.validar = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  var socket = req.app.get("socketio");
  const token = req.header("Authorization").split(" ");
  const detector = new DeviceDetector();
  const userAgent = req.headers["user-agent"];
  const result = detector.detect(userAgent);
  const isTabled = result.device && [DEVICE_TYPE.TABLET].indexOf(result.device.type) !== -1;
  const isMobile = result.device && [DEVICE_TYPE.SMARTPHONE, DEVICE_TYPE.FEATURE_PHONE].indexOf(result.device.type) !== -1;
  const isPhablet = result.device && [DEVICE_TYPE.PHABLET].indexOf(result.device.type) !== -1;
  let esMobil = false;
  if (isTabled || isMobile || isPhablet) {
    esMobil = true;
  }

  models.cuenta_usuario
    .findOne({
      where: {
        usuario: req.body.usuario
      }
    })
    .then(async usuario => {
      if (usuario) {
        if (usuario.estado_registro === false) {
          logger.log("warn", {
            ubicacion: filename,
            message: "Usuario bloqueado, contacte con el administrador del sistema"
          });
          res.status(400).send("Usuario bloqueado, contacte con el administrador del sistema");
          return;
        } else {
          //SI EL MODO EL WEB
          console.log("MODO CONEXION", usuario.modo_conexion);
          console.log("NUMERO DE SERIE", usuario.pc_sn);
          console.log("N/S", token[0]);
          //SOLO WEB
          if (usuario.modo_conexion === 1) {
            if (usuario.pc_sn && usuario.pc_sn.length > 0) {
              if (usuario.pc_sn !== token[0]) {
                logger.log("warn", {
                  ubicacion: filename,
                  message: "No se puede ingresar al sistema - 01"
                });
                res.status(400).send("No se puede ingresar al sistema - 01");
                return;
              }
            } else {
              if (token[0]) {
                await models.cuenta_usuario.update(
                  {
                    pc_sn: token[0]
                  },
                  {
                    where: {
                      usuario: req.body.usuario
                    }
                  }
                );
                usuario["pc_sn"] = token[0];
              } else {
                logger.log("warn", {
                  ubicacion: filename,
                  message: "No se puede ingresar al sistema - 02"
                });
                res.status(400).send("No se puede ingresar al sistema - 02");
                return;
              }
            }
          }
          //WEB + WEB MOBIL
          else if (usuario.modo_conexion === 2) {
            if (usuario.pc_sn === null || usuario.pc_sn === "") {
              if (token[0] !== "nt" && token[0] !== null && token[0].length > 10) {
                await models.cuenta_usuario.update(
                  {
                    pc_sn: token[0]
                  },
                  {
                    where: {
                      usuario: req.body.usuario
                    }
                  }
                );
                usuario["pc_sn"] = token[0];
              }
            } else {
              if (token[0] === "nt" || usuario.pc_sn === token[0]) {
                console.log("logueado");
              } else {
                logger.log("warn", {
                  ubicacion: filename,
                  message: "No se puede ingresar al sistema - 03"
                });
                res.status(400).send("No se puede ingresar al sistema - 03");
                return;
              }
            }
          }
          //APP ANDROID
          else if (usuario.modo_conexion === 3) {
            if (usuario.pc_sn === null || usuario.pc_sn === "") {
              if (token[0] === "app") {
                await models.cuenta_usuario.update(
                  {
                    pc_sn: token[1]
                  },
                  {
                    where: {
                      usuario: req.body.usuario
                    }
                  }
                );
                usuario["pc_sn"] = token[1];
              } else {
                logger.log("warn", {
                  ubicacion: filename,
                  message: "No se puede ingresar al sistema - 04"
                });
                res.status(400).send("No se puede ingresar al sistema - 04");
                return;
              }
            } else {
              if (token[0] === "app") {
                if (usuario.pc_sn === token[1]) {
                  console.log("app log");
                } else {
                  logger.log("warn", {
                    ubicacion: filename,
                    message: "Dispositivo no reconocido - 05"
                  });
                  res.status(400).send("Dispositivo no reconocido - 05");
                  return;
                }
              } else {
                logger.log("warn", {
                  ubicacion: filename,
                  message: "No se puede ingresar al sistema - 06"
                });
                res.status(400).send("No se puede ingresar al sistema - 06");
                return;
              }
            }
          } else if (usuario.modo_conexion !== 4) {
            logger.log("warn", {
              ubicacion: filename,
              message: "No se puede ingresar al sistema - 07"
            });
            res.status(400).send("No se puede ingresar al sistema - 07");
            return;
          }

          bcrypt.compare(req.body.contrasena, usuario.contrasena, async (err, respuesta) => {
            if (respuesta) {
              var inicio = Date.now();
              var end = new Date();
              const fin = end.setHours(23, 59, 59, 999);
              const total = Math.trunc((fin - inicio) / 1000);
              const token = jwt.sign(
                {
                  id: usuario.usuario,
                  n: usuario.usuario_nombre
                },
                key.tokenKey,
                {
                  expiresIn: total
                }
              );
              //obtener perfil de usuario
              const perfil = await models.perfil.findOne({
                where: {
                  perfil_codigo: usuario.perfil_codigo
                },
                include: ["ListaMenu"]
              });
              //guardar usuario en redis
              redis.get(usuario.usuario, function(err, usuarioredis) {
                usuarioredis = JSON.parse(usuarioredis);
                if (usuarioredis !== null && typeof usuarioredis == "object") {
                  if (esMobil) {
                    usuarioredis["token_mobil"] = token;
                    socket.emit(usuario.usuario + "mobil", result.device);
                  } else {
                    usuarioredis["token"] = token;
                  }
                  redis.setex(usuario.usuario, total, JSON.stringify(usuarioredis));
                } else {
                  if (esMobil) {
                    redis.setex(
                      usuario.usuario,
                      total,
                      JSON.stringify({
                        token_mobil: token,
                        perfil_codigo: usuario.perfil_codigo,
                        caja_codigo: usuario.caja_codigo,
                        estado_registro: usuario.estado_registro,
                        modo_conexion: usuario.modo_conexion,
                        pc_sn: usuario.pc_sn
                      })
                    );
                  } else {
                    redis.setex(
                      usuario.usuario,
                      total,
                      JSON.stringify({
                        token: token,
                        perfil_codigo: usuario.perfil_codigo,
                        caja_codigo: usuario.caja_codigo,
                        estado_registro: usuario.estado_registro,
                        modo_conexion: usuario.modo_conexion,
                        pc_sn: usuario.pc_sn
                      })
                    );
                  }
                }
              });

              //guardar perfil en redis
              redis.set(
                "perfil-" + usuario.perfil_codigo,
                JSON.stringify({
                  ListaMenu: perfil.ListaMenu
                })
              );

              res.json({
                token: token,
                _p: perfil.ListaMenu
              });
            } else {
              redis.incr(req.body.usuario, (err, val) => {
                if (!val) {
                  //si no existe val
                  redis.set(req.body.usuario, 1);
                  val = 1;
                }
                if (val >= 3) {
                  //bloquear usuario
                  logger.log("warn", {
                    ubicacion: filename,
                    message: `Usuario ${req.body.usuario} bloqueado, contacte con su supervisor.`
                  });
                  res.status(400).send("Usuario bloqueado, contacte con su supervisor.");
                  models.cuenta_usuario.update(
                    {
                      estado_registro: false
                    },
                    {
                      where: {
                        usuario: req.body.usuario
                      }
                    }
                  );
                } else {
                  let total = 3 - parseInt(val);
                  logger.log("warn", {
                    ubicacion: filename,
                    message: `Usuario ${req.body.usuario} o contraseña inválida, intentos restantes: ${total}`
                  });
                  res.status(400).send(`Usuario o contraseña inválida, intentos restantes: ${total}`);
                }
              });
            }
          });
        }
      } else {
        logger.log("warn", {
          ubicacion: filename,
          message: `Usuario no existe ${req.body.usuario}`
        });
        res.status(409).send(`Usuario no existe`);
      }
    })
    .catch(err => {
      logger.log("error", {
        ubicacion: filename,
        token: token,
        message: { mensaje: err.message, tracestack: err.stack }
      });
      res.status(400).send("Usuario no existe");
    });
};

exports.loginCaja = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  services.decodeToken(token, tokenDecodificado => {
    models.cuenta_usuario
      .findOne({
        where: {
          usuario: tokenDecodificado.id
        },
        include: [
          {
            model: models.caja
          }
        ]
      })
      .then(usuario => {
        if (usuario.estado_registro === false) {
          logger.log("warn", {
            ubicacion: filename,
            token: token,
            message: "Usuario deshabilitado"
          });
          res.status(400).send("Usuario deshabilitado");
          return;
        }

        try {
          if (usuario.caja.estado_registro === false) {
            logger.log("warn", {
              ubicacion: filename,
              token: token,
              message: "Caja deshabilitada"
            });
            res.status(400).send("Caja deshabilitada");
            return;
          }
        } catch (error) {
          logger.log("error", {
            ubicacion: filename,
            token: token,
            message: { mensaje: err.message, tracestack: err.stack }
          });
          res.status(400).send("Usuario no tiene una caja registrada");
          return;
        }

        if (usuario.caja) {
          bcrypt.compare(req.body.contrasena, usuario.caja.caja_contrasena, async (err, respuesta) => {
            if (respuesta) {
              res.json("Contrasena de caja correcta");
            } else {
              logger.log("warn", {
                ubicacion: filename,
                token: token,
                message: "Contraseña invalida"
              });
              res.status(400).send("Contraseña invalida");
            }
          });
        }
      });
  });
};

exports.validarCaja = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  var socket = req.app.get("socketio");
  const token = req.header("Authorization").split(" ")[1];
  const detector = new DeviceDetector();
  const userAgent = req.headers["user-agent"];
  //agregue aqui para tipo de conexion
  const headers = req.headers;
  const result = detector.detect(userAgent);
  const isTabled = result.device && [DEVICE_TYPE.TABLET].indexOf(result.device.type) !== -1;
  const isMobile = result.device && [DEVICE_TYPE.SMARTPHONE, DEVICE_TYPE.FEATURE_PHONE].indexOf(result.device.type) !== -1;
  const isPhablet = result.device && [DEVICE_TYPE.PHABLET].indexOf(result.device.type) !== -1;

  let esMobil = false;
  if (isTabled || isMobile || isPhablet) {
    esMobil = true;
  }

  services.decodeToken(token, tokenDecodificado => {
    models.cuenta_usuario
      .findOne({
        where: {
          usuario: tokenDecodificado.id
        },
        include: [
          {
            model: models.caja
          }
        ]
      })
      .then(usuario => {
        try {
          if (usuario.caja.estado_registro === false) {
            logger.log("warn", {
              ubicacion: filename,
              token: token,
              message: "Caja deshabilitada"
            });
            res.status(400).send("Caja deshabilitada");
            return;
          }
        } catch (error) {
          logger.log("warn", {
            ubicacion: filename,
            token: token,
            message: "Usuario no tiene una caja registrada"
          });
          res.status(400).send("Usuario no tiene una caja registrada");
          return;
        }
        if (usuario.caja) {
          bcrypt.compare(req.body.contrasena, usuario.caja.caja_contrasena, async (err, respuesta) => {
            if (respuesta) {
              //VERIFICAR SI TIENE HABILITACIONES PENDIENTES DE SER ACEPTADAS
              const habilitaciones = await models.habilitacion.findAll({
                where: {
                  [Op.or]: [{ origen_caja_codigo: usuario.caja.caja_codigo }, { destino_caja_codigo: usuario.caja.caja_codigo }],
                  habilitacion_estado: "PENDIENTE"
                }
              });
              let cantidadHabAntiguas = 0;
              let hab = {};
              if (habilitaciones) {
                var YESTERDAY = moment()
                  .subtract(1, "days")
                  .startOf("day");
                habilitaciones.map(habilitacion => {
                  const momentDate = moment(habilitacion.createdAt);
                  const x = momentDate.isSameOrBefore(YESTERDAY, "d");
                  if (x) {
                    cantidadHabAntiguas = cantidadHabAntiguas + 1;
                  }
                });

                if (cantidadHabAntiguas > 0) {
                  hab = {
                    h: cantidadHabAntiguas
                  };
                }
              }
              //FIN ---- VERIFICAR SI TIENE HABILITACIONES PENDIENTES DE SER ACEPTADAS---//
              //-------------------------------------------------------------------------//

              //GENERAR NUEVO TOKEN CON ID DE CAJA
              var inicio = Date.now();
              var end = new Date();
              const fin = end.setHours(23, 59, 59, 999);
              const total = Math.trunc((fin - inicio) / 1000);
              const token = jwt.sign(
                {
                  id: usuario.usuario,
                  idc: usuario.caja.caja_codigo,
                  of: usuario.caja.oficina_codigo,
                  dt: usuario.puede_editar_DT,
                  ...hab
                },
                key.tokenKey,
                {
                  expiresIn: total
                }
              );

              //ver cajaTRabajo de hoy
              const cajaTrabajo = await models.caja_trabajo.findOne({
                where: {
                  fecha_trabajo: Date.now(),
                  caja_codigo: usuario.caja_codigo
                }
              });

              //EXISTE UNA CAJA EL DIA DE HOY?
              if (cajaTrabajo) {
                //CAJA ESTA ABIERTA?
                if (cajaTrabajo.estado_caja === "ABIERTO") {
                  //GUARDAR EL CONTRATO EN REDIS PARA LA VALIDACION DE SALDOS
                  const contrato = await models.contrato.findOne({
                    where: {
                      oficina_codigo: usuario.caja.oficina_codigo
                    },
                    include: [
                      {
                        model: models.oficina
                      }
                    ]
                  });
                  if (contrato) {
                    redis.set("contrato-" + usuario.caja.oficina_codigo, JSON.stringify(contrato));
                  }
                  //FIN - GUARDAR EL CONTRATO EN REDIS PARA LA VALIDACION DE SALDOS//
                  //---------------------------------------------------------------//

                  redis.set(
                    usuario.caja_codigo,
                    JSON.stringify({
                      fecha_trabajo: cajaTrabajo.fecha_trabajo,
                      usuario_apertura: cajaTrabajo.usuario_apertura,
                      estado_caja: cajaTrabajo.estado_caja,
                      verificar_saldo_caja: usuario.caja.verificar_saldo_caja
                    })
                  );
                  //GUARDAR NUEVO TOKEN EN REDIS
                  redis.get(usuario.usuario, function(err, usuarioRedis) {
                    usuarioRedis = JSON.parse(usuarioRedis);
                    if (usuarioRedis !== null) {
                      if (esMobil) {
                        usuarioRedis["token_mobil"] = token;
                        usuarioRedis["oficina_codigo"] = usuario.caja.oficina_codigo;
                        usuarioRedis["puede_editar_DT"] = usuario.puede_editar_DT;
                        socket.emit(usuario.usuario + "mobil", result.device);
                      } else {
                        usuarioRedis["token"] = token;
                        usuarioRedis["oficina_codigo"] = usuario.caja.oficina_codigo;
                        usuarioRedis["puede_editar_DT"] = usuario.puede_editar_DT;
                      }
                      redis.setex(usuario.usuario, total, JSON.stringify(usuarioRedis));
                    } else {
                      if (esMobil) {
                        redis.setex(
                          usuario.usuario,
                          total,
                          JSON.stringify({
                            token_mobil: token,
                            perfil_codigo: usuario.perfil_codigo,
                            caja_codigo: usuario.caja_codigo,
                            estado_registro: usuario.estado_registro,
                            oficina_codigo: usuario.caja.oficina_codigo,
                            puede_editar_DT: usuario.puede_editar_DT,
                            modo_conexion: usuario.modo_conexion,
                            pc_sn: usuario.pc_sn
                          })
                        );
                      } else {
                        redis.setex(
                          usuario.usuario,
                          total,
                          JSON.stringify({
                            token: token,
                            perfil_codigo: usuario.perfil_codigo,
                            caja_codigo: usuario.caja_codigo,
                            estado_registro: usuario.estado_registro,
                            oficina_codigo: usuario.caja.oficina_codigo,
                            puede_editar_DT: usuario.puede_editar_DT,
                            modo_conexion: usuario.modo_conexion,
                            pc_sn: usuario.pc_sn
                          })
                        );
                      }
                    }
                  });

                  res.json({
                    token: token
                  });
                } //CAJA CERRADA
                else {
                  logger.log("warn", {
                    ubicacion: filename,
                    token: token,
                    message: "LA CAJA SE ENCUENTRA CERRADA EL DIA DE HOY"
                  });
                  res.status(405).send("LA CAJA SE ENCUENTRA CERRADA EL DIA DE HOY");
                }
              }
              //APERTURAR CAJA
              else {
                let cajaAnterior = await models.caja_trabajo.findAll({
                  limit: 1,
                  order: [["fecha_trabajo", "DESC"]],
                  where: {
                    caja_codigo: usuario.caja_codigo
                  }
                });
                /**
                 * VERIFICAR DATOS PARA APERTURAR CAJA
                 * VERIFICAR SI EXISTEN DATOS PARA APERTURA DE CAJA
                 * EL SALDO INICIAL DE HOY DEBE SER IGUAL AL SALDO FINAL DEL DIA ANTERIOR
                 */

                //EXISTE CAJA DEL DIA ANTERIOR? O ES LA PRIMERA VEZ QUE SE ABRE LA CAJA EN EL SISTEMA
                if (cajaAnterior.length > 0) {
                  cajaAnterior = cajaAnterior[0];
                  if (typeof req.body.Saldo1 !== "undefined" && typeof req.body.Saldo2 !== "undefined" && typeof req.body.Saldo3 !== "undefined") {
                    //si la caja del dia anterior esta cerrada -> abrir caja
                    if (cajaAnterior.estado_caja === "CERRADO") {
                      /**
                       * Verificar los saldos del dia anterior coninciden con los
                       * ingresados hoy, si coinciden aperturar caja
                       */
                      if (
                        parseFloat(req.body.Saldo1) === parseFloat(cajaAnterior.Saldo1) &&
                        parseFloat(req.body.Saldo2) === parseFloat(cajaAnterior.Saldo2) &&
                        parseFloat(req.body.Saldo3) === parseFloat(cajaAnterior.Saldo3)
                      ) {
                        models.caja_trabajo
                          .create({
                            fecha_trabajo: Date.now(),
                            caja_codigo: usuario.caja_codigo,
                            usuario_apertura: usuario.usuario,
                            fecha_hora_apertura: Date.now(),
                            estado_caja: "ABIERTO"
                          })
                          .then(async respuesta => {
                            //============================================================================
                            //tipo de conexion
                            models.tipo_conexion
                              .create({
                                usuario: usuario.usuario,
                                fecha_trabajo: Date.now(),
                                caja_codigo: usuario.caja_codigo,
                                fecha_hora_apertura: Date.now(),
                                estado_caja: "ABIERTO",
                                tipo_conexion_sistema_op: result.os.name,
                                tipo_conexion_navegador: result.client.name,
                                tipo_dispositivo: result.device.type,
                                pc_movil_marca: result.device.brand,
                                pc_movil_modelo: result.device.model
                              })
                            //====================================================================================
                            //GUARDAR EL CONTRATO EN REDIS PARA LA VALIDACION DE SALDOS
                            const contrato = await models.contrato.findOne({
                              where: {
                                oficina_codigo: usuario.caja.oficina_codigo
                              },
                              include: [
                                {
                                  model: models.oficina
                                }
                              ]
                            });

                            if (contrato) {
                              redis.set("contrato-" + usuario.caja.oficina_codigo, JSON.stringify(contrato));
                            }

                            //FIN - GUARDAR EL CONTRATO EN REDIS PARA LA VALIDACION DE SALDOS//
                            //---------------------------------------------------------------//

                            //GUARDAR EN REDIS
                            redis.set(
                              usuario.caja_codigo,
                              JSON.stringify({
                                fecha_trabajo: respuesta.fecha_trabajo,
                                usuario_apertura: respuesta.usuario_apertura,
                                estado_caja: respuesta.estado_caja,
                                verificar_saldo_caja: usuario.caja.verificar_saldo_caja
                              })
                            );
                            //GUARDAR NUEVO TOKEN EN REDIS
                            redis.get(usuario.usuario, function(err, usuarioRedis) {
                              usuarioRedis = JSON.parse(usuarioRedis);
                              if (usuarioRedis !== null) {
                                if (esMobil) {
                                  usuarioRedis["token_mobil"] = token;
                                  usuarioRedis["oficina_codigo"] = usuario.caja.oficina_codigo;
                                  usuarioRedis["puede_editar_DT"] = usuario.puede_editar_DT;
                                  socket.emit(usuario.usuario + "mobil", result.device);
                                } else {
                                  usuarioRedis["token"] = token;
                                  usuarioRedis["oficina_codigo"] = usuario.caja.oficina_codigo;
                                  usuarioRedis["puede_editar_DT"] = usuario.puede_editar_DT;
                                }
                                redis.setex(usuario.usuario, total, JSON.stringify(usuarioRedis));
                              } else {
                                if (esMobil) {
                                  redis.setex(
                                    usuario.usuario,
                                    total,
                                    JSON.stringify({
                                      token_mobil: token,
                                      perfil_codigo: usuario.perfil_codigo,
                                      caja_codigo: usuario.caja_codigo,
                                      estado_registro: usuario.estado_registro,
                                      oficina_codigo: usuario.caja.oficina_codigo,
                                      puede_editar_DT: usuario.puede_editar_DT,
                                      modo_conexion: usuario.modo_conexion,
                                      pc_sn: usuario.pc_sn
                                    })
                                  );
                                } else {
                                  redis.setex(
                                    usuario.usuario,
                                    total,
                                    JSON.stringify({
                                      token: token,
                                      perfil_codigo: usuario.perfil_codigo,
                                      caja_codigo: usuario.caja_codigo,
                                      estado_registro: usuario.estado_registro,
                                      oficina_codigo: usuario.caja.oficina_codigo,
                                      puede_editar_DT: usuario.puede_editar_DT,
                                      modo_conexion: usuario.modo_conexion,
                                      pc_sn: usuario.pc_sn
                                    })
                                  );
                                }
                              }
                            });
                            //ENVIAR RESPUESTA
                            res.json({
                              token: token
                            });
                          })
                          .catch(err => {
                            logger.log("error", {
                              ubicacion: filename,
                              token: token,
                              err
                            });
                            res.status(412).send(err);
                          });
                      } else {
                        logger.log("warn", {
                          ubicacion: filename,
                          token: token,
                          message: "Error, Saldos no coinciden"
                        });
                        res.status(400).send("Error, Saldos no coinciden");
                      }
                    } else {
                      /**
                       * si la caja se encuentra abierta
                       * enviar mensaje de error caja abierta
                       */
                      let mensaje = {};
                      if (cajaAnterior.estado_caja === "ABIERTO") {
                        mensaje = {
                          error:
                            "La caja del dia " +
                            moment(cajaAnterior.fecha_trabajo)
                              .locale("es")
                              .format("LLLL") +
                            " se encuentra abierta, Ingrese sus saldos para cerrar caja",
                          cajaEstado: "ABIERTO"
                        };
                      }
                      logger.log("warn", {
                        ubicacion: filename,
                        token: token,
                        mensaje
                      });
                      res.json({
                        mensaje: "Contrasena de caja correcta, ingrese datos para aperturar caja",
                        ...mensaje
                      });
                    }
                  } else {
                    /**
                     * Si no existen datos para aperturar caja enviar mensaje solicitando datos
                     */
                    let mensaje = {};
                    if (cajaAnterior.estado_caja === "ABIERTO") {
                      mensaje = {
                        error:
                          "La caja del dia " +
                          moment(cajaAnterior.fecha_trabajo)
                            .locale("es")
                            .format("LLLL") +
                          " se encuentra abierta",
                        cajaEstado: "ABIERTO"
                      };
                    }
                    res.json({
                      mensaje: "Contrasena de caja correcta, ingrese datos para aperturar caja",
                      ...mensaje
                    });
                  }
                } //si no existen registros en caja_trabajo registradas
                else {
                  //se ejecuta una sola vez si la bd no contiene esa caja
                  models.caja_trabajo
                    .create({
                      fecha_trabajo: Date.now(),
                      caja_codigo: usuario.caja_codigo,
                      usuario_apertura: usuario.usuario,
                      fecha_hora_apertura: Date.now(),
                      estado_caja: "ABIERTO"
                    })
                    .then(respuesta => {
                      redis.set(
                        usuario.caja_codigo,
                        JSON.stringify({
                          fecha_trabajo: respuesta.fecha_trabajo,
                          usuario_apertura: respuesta.usuario_apertura,
                          estado_caja: respuesta.estado_caja,
                          verificar_saldo_caja: usuario.caja.verificar_saldo_caja
                        })
                      );
                      //GUARDAR NUEVO TOKEN EN REDIS
                      redis.get(usuario.usuario, function(err, usuarioRedis) {
                        usuarioRedis = JSON.parse(usuarioRedis);
                        if (usuarioRedis !== null) {
                          if (esMobil) {
                            usuarioRedis["token_mobil"] = token;
                            usuarioRedis["oficina_codigo"] = usuario.caja.oficina_codigo;
                            usuarioRedis["puede_editar_DT"] = usuario.puede_editar_DT;
                            socket.emit(usuario.usuario + "mobil", result.device);
                          } else {
                            usuarioRedis["token"] = token;
                            usuarioRedis["oficina_codigo"] = usuario.caja.oficina_codigo;
                            usuarioRedis["puede_editar_DT"] = usuario.puede_editar_DT;
                          }
                          redis.setex(usuario.usuario, total, JSON.stringify(usuarioRedis));
                        } else {
                          if (esMobil) {
                            redis.setex(
                              usuario.usuario,
                              total,
                              JSON.stringify({
                                token_mobil: token,
                                perfil_codigo: usuario.perfil_codigo,
                                caja_codigo: usuario.caja_codigo,
                                estado_registro: usuario.estado_registro,
                                oficina_codigo: usuario.caja.oficina_codigo,
                                puede_editar_DT: usuario.puede_editar_DT,
                                modo_conexion: usuario.modo_conexion,
                                pc_sn: usuario.pc_sn
                              })
                            );
                          } else {
                            redis.setex(
                              usuario.usuario,
                              total,
                              JSON.stringify({
                                token: token,
                                perfil_codigo: usuario.perfil_codigo,
                                caja_codigo: usuario.caja_codigo,
                                estado_registro: usuario.estado_registro,
                                oficina_codigo: usuario.caja.oficina_codigo,
                                puede_editar_DT: usuario.puede_editar_DT,
                                modo_conexion: usuario.modo_conexion,
                                pc_sn: usuario.pc_sn
                              })
                            );
                          }
                        }
                      });

                      res.json({
                        token: token
                      });
                    })
                    .catch(err => {
                      logger.log("error", {
                        ubicacion: filename,
                        token: token,
                        message: { mensaje: err.message, tracestack: err.stack }
                      });
                      res.status(412).send(err);
                    });
                }
              }
            } else {
              /*
							redis.incr(req.body.usuario, (err, val) => {
								if (val === 3) {
									//bloquear usuario
									console.log("usuario bloqueado");
									res.status(400).send("Usuario o contraseña inválida");
								}
							});*/
              logger.log("warn", {
                ubicacion: filename,
                token: token,
                message: "Contraseña incorrecta"
              });
              res.status(400).send("Contraseña incorrecta");
            }
          });
        } else {
          logger.log("warn", {
            ubicacion: filename,
            token: token,
            message: "Su usuario no tiene ninguna caja asignada"
          });
          res.status(401).send("Su usuario no tiene ninguna caja asignada");
        }
      });
  });
};

exports.buscar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.cuenta_usuario
    .findByPk(req.params.usuario)
    .then(objeto => {
      res.json(objeto);
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

exports.actualizar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  let obj = {};
  req.body.contrasena
    ? (obj = {
        contrasena: bcrypt.hashSync(req.body.contrasena, 8)
      })
    : null;
  models.cuenta_usuario
    .update(
      {
        ...obj,
        usuario_nombre: req.body.usuario_nombre,
        pregunta_secreta: req.body.pregunta_secreta,
        respuesta: req.body.respuesta,
        contrasena_old: req.body.contrasena_old,
        empresa_codigo: req.body.empresa_codigo,
        caja_codigo: req.body.caja_codigo,
        perfil_codigo: req.body.perfil_codigo,
        puede_editar_DT: req.body.puede_editar_DT,
        pc_sn: req.body.pc_sn,
        modo_conexion: req.body.modo_conexion,
        tipo_arqueo: req.body.tipo_arqueo
      },
      {
        where: {
          usuario: req.params.usuario
        }
      }
    )
    .then(filasAfectadas => {
      var redis = req.app.get("redis");
      let usuario = req.params.usuario;
      redis.get(usuario, async function(err, usuarioXeliminar) {
        usuarioXeliminar = JSON.parse(usuarioXeliminar);
        if (usuarioXeliminar !== null) {
          const cajaUsuario = usuarioXeliminar.caja_codigo;
          //ELIMINAR DATOS DEL USUARIO DE REDIS
          await redis.del(usuario);
          //ELIMINAR CAJA SI EXISTIERA
          cajaUsuario ? redis.del(cajaUsuario) : null;
          res.json(filasAfectadas);
        } else {
          res.json(filasAfectadas);
        }
      });
    })
    .catch(err => {
      logger.log("error", {
        ubicacion: filename,
        token: token,
        message: { mensaje: err.message, tracestack: err.stack }
      });
      res.status(412).send(err);
    });
};

exports.desactivar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.cuenta_usuario
    .update(
      {
        estado_registro: req.body.estado_registro
      },
      {
        where: {
          usuario: req.params.usuario
        }
      }
    )
    .then(filasAfectadas => {
      var redis = req.app.get("redis");
      let usuario = req.params.usuario;
      redis.get(usuario, async function(err, usuarioXeliminar) {
        usuarioXeliminar = JSON.parse(usuarioXeliminar);
        if (usuarioXeliminar !== null) {
          const cajaUsuario = usuarioXeliminar.caja_codigo;
          //ELIMINAR DATOS DEL USUARIO DE REDIS
          await redis.del(usuario);
          //ELIMINAR CAJA SI EXISTIERA
          cajaUsuario ? redis.del(cajaUsuario) : null;
          res.json(filasAfectadas);
        } else {
          res.json(filasAfectadas);
        }
      });
    })
    .catch(err => {
      logger.log("error", {
        ubicacion: filename,
        token: token,
        message: { mensaje: err.message, tracestack: err.stack }
      });
      res.status(412).send(err);
    });
};

exports.cambiarContrasena = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  utils.decodeToken(token, tokenDecodificado => {
    models.cuenta_usuario
      .findOne({
        where: {
          usuario: tokenDecodificado.id
        }
      })
      .then(usuario => {
        bcrypt.compare(req.body.contrasena_old, usuario.contrasena, async (err, respuesta) => {
          if (respuesta) {
            models.cuenta_usuario
              .update(
                {
                  contrasena: bcrypt.hashSync(req.body.contrasena, 8),
                  contrasena_old: req.body.contrasena_old
                },
                {
                  where: {
                    usuario: tokenDecodificado.id
                  }
                }
              )
              .then(filasAfectadas => {
                var redis = req.app.get("redis");
                redis.get(tokenDecodificado.id, async function(err, usuarioXeliminar) {
                  usuarioXeliminar = JSON.parse(usuarioXeliminar);
                  if (usuarioXeliminar !== null) {
                    const cajaUsuario = usuarioXeliminar.caja_codigo;
                    //ELIMINAR DATOS DEL USUARIO DE REDIS
                    await redis.del(tokenDecodificado.id);
                    //ELIMINAR CAJA SI EXISTIERA
                    cajaUsuario ? redis.del(cajaUsuario) : null;
                    res.json(filasAfectadas);
                  }
                });
              })
              .catch(err => {
                logger.log("error", {
                  ubicacion: filename,
                  token: token,
                  message: { mensaje: err.message, tracestack: err.stack }
                });
                res.status(412).send("No se pudo cambiar la contraseña de usuario");
              });
          } else {
            logger.log("warn", {
              ubicacion: filename,
              token: token,
              message: "La contraseña actual no es válida"
            });
            res.status(409).send("La contraseña actual no es válida");
          }
        });
      });
  });
};

exports.listar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.cuenta_usuario
    .findAll({
      attributes: [
        "usuario",
        "usuario_nombre",
        "estado_registro",
        "perfil_codigo",
        "caja_codigo",
        "pregunta_secreta",
        "createdAt",
        "puede_editar_DT",
        "pc_sn",
        "modo_conexion",
        "tipo_arqueo"
      ],
      include: [
        {
          attributes: [
            "caja_codigo",
            "caja_nombre",
            "direccion_ip_acceso",
            "almacen_defecto",
            "estado_registro",
            "oficina_codigo",
            "verificar_saldo_caja",
            "createdAt"
          ],
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
      ],
      order: [["usuario_nombre", "ASC"]]
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

exports.tipoArqueo = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  utils.decodeToken(token, tokenDecodificado => {
    models.cuenta_usuario
      .findOne({
        where: {
          usuario: tokenDecodificado.id
        }
      })
      .then(usuario => {
        res.json({ tipo_arqueo: usuario.tipo_arqueo });
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

exports.eliminar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.cuenta_usuario
    .destroy({
      where: {
        usuario: req.params.usuario
      }
    })
    .then(respuesta => {
      res.json({
        mensaje: respuesta
      });
    })
    .catch(err => {
      logger.log("error", {
        ubicacion: filename,
        token: token,
        message: { mensaje: err.message, tracestack: err.stack }
      });
      res.status(409).send(err);
    });
};
