const utils = require("../services/utils")
const Sequelize = require("sequelize");
const models = require("../models");
const cache = require("../config/cache");
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.crear = (req, res) => {
  models.caja_trabajo
    .create({
      fecha_trabajo: Date.now(),
      caja_codigo: req.body.caja_codigo,
      usuario_apertura: req.body.usuario_apertura,
      fecha_hora_apertura: req.body.fecha_hora_apertura,
      fecha_hora_cierre: req.body.fecha_hora_cierre,
      usurio_cierre: req.body.usurio_cierre,
      estado_caja: req.body.estado_caja,
      Saldo1: req.body.Saldo1,
      Saldo2: req.body.Saldo2,
      Saldo3: req.body.Saldo3
    })
    .then(objeto => {
      res.json({
        mensaje: objeto
      });
    })
    .catch(err => {
      res.json({
        error: err.errors
      });
    });
};

exports.cerrarCaja = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, async (err, usuario) => {
      usuario = JSON.parse(usuario);

      //OBTENER DATOS DE CAJA DESDE db
      models.caja_trabajo
        .findAll({
          limit: 1,
          order: [["createdAt", "DESC"]],
          where: {
            caja_codigo: usuario.caja_codigo
          },
          include: [
            {
              model: models.caja
            }
          ]
        })
        .then(cajaTrabajo => {
          cajaTrabajo = cajaTrabajo[0];
          if (cajaTrabajo.caja.estado_registro) {
            if (cajaTrabajo.estado_caja) {
              if (cajaTrabajo.estado_caja === "ABIERTO") {
                //sumar todos los ingresos y egresos de todas la monedas
                const fechaTrabajo = cajaTrabajo.fecha_trabajo.split("-");
                const yyyy = fechaTrabajo[0];
                const mm = fechaTrabajo[1];
                const dd = fechaTrabajo[2];
                const fecha = `${yyyy}-${mm}-${dd}`;
                models.sequelize
                  .query(`select * from obtener_saldos_caja(:fechaTrabajo, :cajacodigo)`, {
                    replacements: {
                      fechaTrabajo: fecha,
                      cajacodigo: cajaTrabajo.caja_codigo
                    },
                    type: models.sequelize.QueryTypes.SELECT
                  })
                  .then(totales => {
                    totales = totales[0];
                    //comparar con los montos ingresados
                    const saldo1bd = parseFloat(totales.Saldo1);
                    const saldo2bd = parseFloat(totales.Saldo2);
                    const saldo3bd = parseFloat(totales.Saldo3);
                    if (saldo1bd == req.body.Saldo1 && saldo2bd == req.body.Saldo2 && saldo3bd == req.body.Saldo3) {
                      //cerrar caja
                      models.caja_trabajo
                        .update(
                          {
                            fecha_hora_cierre: Date.now(),
                            usuario_cierre: tokenDecodificado.id,
                            estado_caja: "CERRADO",
                            Saldo1: saldo1bd,
                            Saldo2: saldo2bd,
                            Saldo3: saldo3bd
                          },
                          {
                            where: {
                              fecha_trabajo: fecha,
                              caja_codigo: cajaTrabajo.caja_codigo
                            }
                          }
                        )
                        .then(resp => {
                          var socket = req.app.get("socketio");
                          redis.get(cajaTrabajo.caja_codigo, (err, caja) => {
                            caja = JSON.parse(caja);
                            if (caja != null) {
                              caja.estado_caja = "CERRADO";
                              cache.setValue(cajaTrabajo.caja_codigo, JSON.stringify(caja))
                            }

                            const listaMonedas = req.body.listaMonedas;
                            if (!listaMonedas) {
                              socket.emit(cajaTrabajo.caja_codigo + "cerrada", {
                                mensaje: "Caja cerrada por usuario " + tokenDecodificado.id
                              });
                              res.json(resp);
                            }
                          });
                        })
                        .catch(err => {
                          logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
                          res.status(400).send(err);
                        });
                    } else {
                      logger.log("warn", {
                        ubicacion: filename,
                        token: token,
                        mensaje: "Los saldos no coinciden "
                      });
                      res.status(400).send("Los saldos no coinciden ");
                    }
                  })
                  .catch(err => {
                    logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
                    res.status(400).send(err);
                  });
              } else {
                logger.log("warn", { ubicacion: filename, token: token, message: "La caja se encuentra cerrada" });
                res.status(400).send({ mensaje: "La caja se encuentra cerrada" });
              }
            } else {
              logger.log("warn", { ubicacion: filename, token: token, message: "La caja no existe" });
              res.status(400).send({ mensaje: "La caja no existe" });
            }
          } else {
            logger.log("error", { ubicacion: filename, token: token, message: { mensaje: "Caja deshabilitada" } });
            res.status(409).send({ mensaje: "La caja se encuentra deshabilitada" });
          }
        })
        .catch(err => {
          logger.log("error", filename, { err, token });
          res.status(412).send("Error al cerrar caja");
        });
    });
  });
};

exports.abrirCajaCentral = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      return models.sequelize
        .transaction(
          {
            isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
          },
          t => {
            return models.caja_trabajo
              .findOne(
                {
                  where: {
                    fecha_trabajo: Date.now(),
                    caja_codigo: req.body.caja_codigo
                  },
                  include: [
                    {
                      model: models.caja
                    }
                  ]
                },
                {
                  transaction: t
                }
              )
              .then(async cajaTrabajo => {
                //SI EXISTE UNA CAJA
                if (cajaTrabajo) {
                  throw new Error("La caja ya se encuentra abierta");
                } else {
                  //COMPROBAR SI LA CAJA DEL DIA ANTERIOR ESTA CERRADA
                  let cajaAnterior = await models.caja_trabajo.findOne({
                    order: [["fecha_trabajo", "DESC"]],
                    where: {
                      caja_codigo: req.body.caja_codigo
                    }
                  });

                  if (cajaAnterior) {
                    if (cajaAnterior.estado_caja === "ABIERTO") {
                      const mensaje =
                        "La caja del dia " +
                        moment(cajaAnterior.fecha_trabajo)
                          .locale("es")
                          .format("LLLL") +
                        ", se encuentra abierta.";
                      throw new Error(mensaje);
                    }
                  }
                  const cajausuario = await models.caja.findOne({
                    where: {
                      caja_codigo: req.body.caja_codigo
                    }
                  });
                  if (cajausuario == null) {
                    throw new Error("No existe caja");
                  }
                  return models.caja_trabajo
                    .create({
                      fecha_trabajo: Date.now(),
                      caja_codigo: req.body.caja_codigo,
                      usuario_apertura: tokenDecodificado.id,
                      fecha_hora_apertura: Date.now(),
                      estado_caja: "ABIERTO"
                    })
                    .then(
                      cajaApertura => {
                        cache.setValue(
                          req.body.caja_codigo,
                          JSON.stringify({
                            fecha_trabajo: cajaApertura.fecha_trabajo,
                            usuario_apertura: cajaApertura.usuario_apertura,
                            estado_caja: cajaApertura.estado_caja,
                            verificar_saldo_caja: cajausuario.verificar_saldo_caja
                          })
                        );
                      },
                      { transaction: t }
                    );
                }
              });
          }
        )
        .then(resp => {
          res.json({ mensaje: "Caja abierta" });
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
          res.status(409).send(err.message);
        });
    });
  });
};

exports.cerrarCajaCentral = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      return models.sequelize
        .transaction(
          {
            isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
          },
          t => {
            return models.caja_trabajo
              .findOne(
                {
                  order: [["fecha_trabajo", "DESC"]],
                  where: {
                    caja_codigo: req.body.caja_codigo
                  },
                  include: [
                    {
                      attributes: ["oficina_codigo", "estado_registro"],
                      model: models.caja,
                      required: false
                    }
                  ]
                },
                {
                  transaction: t
                }
              )
              .then(async cajaAnterior => {
                /*
                const habilitacionesPendientes = await models.habilitacion.findAll({
                  where: {
                    [Op.or]: [{ origen_caja_codigo: req.body.caja_codigo }, { destino_caja_codigo: req.body.caja_codigo }],
                    habilitacion_estado: "PENDIENTE"
                  }
                });
                if (habilitacionesPendientes.length > 0) {
                  throw new Error("No se puede cerrar caja, tiene habilitaciones pendientes de ser aceptadas");
                }
*/
                if (cajaAnterior) {
                  if (cajaAnterior.caja.estado_registro) {
                    if (cajaAnterior.estado_caja === "CERRADO") {
                      throw new Error("La caja se encuentra cerrada");
                    } else {
                      return models.sequelize
                        .query(`select * from obtener_saldos_caja(:fechaTrabajo, :cajacodigo)`, {
                          replacements: {
                            fechaTrabajo: cajaAnterior.fecha_trabajo,
                            cajacodigo: cajaAnterior.caja_codigo
                          },
                          type: models.sequelize.QueryTypes.SELECT,
                          transaction: t
                        })
                        .then(totales => {
                          totales = totales[0];
                          //comparar con los montos ingresados
                          const saldo1bd = parseFloat(totales.Saldo1);
                          const saldo2bd = parseFloat(totales.Saldo2);
                          const saldo3bd = parseFloat(totales.Saldo3);
                          if (saldo1bd == req.body.Saldo1 && saldo2bd == req.body.Saldo2 && saldo3bd == req.body.Saldo3) {
                            return models.caja_trabajo
                              .update(
                                {
                                  usuario_cierre: tokenDecodificado.id,
                                  fecha_hora_cierre: Date.now(),
                                  estado_caja: "CERRADO",
                                  Saldo1: saldo1bd,
                                  Saldo2: saldo2bd,
                                  Saldo3: saldo3bd
                                },
                                {
                                  where: {
                                    caja_codigo: cajaAnterior.caja_codigo,
                                    fecha_trabajo: cajaAnterior.fecha_trabajo
                                  },
                                  transaction: t
                                }
                              )
                              .then(respuesta => {
                                var socket = req.app.get("socketio");
                                redis.get(cajaAnterior.caja_codigo, (err, caja) => {
                                  caja = JSON.parse(caja);
                                  if (caja != null) {
                                    caja.estado_caja = "CERRADO";
                                    cache.setValue(cajaAnterior.caja_codigo, JSON.stringify(caja));
                                    socket.emit(cajaAnterior.caja_codigo + "cerrada", {
                                      mensaje: "Caja cerrada por usuario " + tokenDecodificado.id
                                    });
                                  }
                                  //res.json({ mensaje: "caja cerrada" });
                                });
                              });
                          } else {
                            throw new Error("Los saldos no coinciden");
                          }
                        });
                    }
                  } else {
                    logger.log("error", { ubicacion: filename, token: token, message: { mensaje: "Caja deshabilitada, no se puede cerrar" } });
                    res.status(409).send("La caja se encuentra deshabilitada, no se puede cerrar");
                  }
                } else {
                  throw new Error("No existe ninguna caja");
                }
              });
          }
        )
        .then(respuesta => {
          res.json({ mensaje: "Caja cerrada correctamente" });
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
          res.status(409).send(err.message);
        });
    });
  });
};

exports.obtenerSaldos = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    models.cuenta_usuario
      .findOne({
        where: {
          usuario: tokenDecodificado.id
        }
      })
      .then(usuario => {
        if (usuario.tipo_arqueo === "VER SALDOS") {
          models.caja_trabajo
            .findOne({
              order: [["createdAt", "DESC"]],
              where: {
                caja_codigo: usuario.caja_codigo
              }
            })
            .then(cajaTrabajo => {
              if (cajaTrabajo.estado_caja === "CERRADO") {
                res.status(409).send("Su caja ya se encuentra cerrada");
                return;
              }
              if (cajaTrabajo) {
                models.sequelize
                  .query(`select * from obtener_saldos_caja(:fechaTrabajo, :cajacodigo)`, {
                    replacements: {
                      fechaTrabajo: cajaTrabajo.fecha_trabajo,
                      cajacodigo: cajaTrabajo.caja_codigo
                    },
                    type: models.sequelize.QueryTypes.SELECT
                  })
                  .then(totales => {
                    totales = totales[0];
                    //comparar con los montos ingresados
                    const saldo1bd = parseFloat(totales.Saldo1);
                    const saldo2bd = parseFloat(totales.Saldo2);
                    const saldo3bd = parseFloat(totales.Saldo3);
                    const saldos = {
                      Saldo1: saldo1bd,
                      Saldo2: saldo2bd,
                      Saldo3: saldo3bd
                    };
                    res.json(saldos);
                  });
              } else {
                logger.log("warn", { ubicacion: filename, token: token, message: "Caja trabajo no existe" });
                res.status(409).send("Caja trabajo no existe");
              }
            })
            .catch(err => {
              logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
              res.status(409).send("Sin caja");
            });
        } else {
          logger.log("warn", { ubicacion: filename, token: token, message: "Usted no puede acceder a esa informacion" });
          res.status(409).send("Usted no puede acceder a esa informacion");
        }
      });
  });
};

exports.obtenerCajaTrabajo = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.caja_trabajo
    .findOne({
      order: [["createdAt", "DESC"]],
      where: {
        caja_codigo: req.params.caja_codigo
      }
    })
    .then(cajaTrabajo => {
      if (cajaTrabajo) {
        models.sequelize
          .query(`select * from obtener_saldos_caja(:fechaTrabajo, :cajacodigo)`, {
            replacements: {
              fechaTrabajo: cajaTrabajo.fecha_trabajo,
              cajacodigo: cajaTrabajo.caja_codigo
            },
            type: models.sequelize.QueryTypes.SELECT
          })
          .then(totales => {
            totales = totales[0];
            //comparar con los montos ingresados
            const saldo1bd = parseFloat(totales.Saldo1);
            const saldo2bd = parseFloat(totales.Saldo2);
            const saldo3bd = parseFloat(totales.Saldo3);
            cajaTrabajo.Saldo1 = saldo1bd;
            cajaTrabajo.Saldo2 = saldo2bd;
            cajaTrabajo.Saldo3 = saldo3bd;
            res.json(cajaTrabajo);
          });
      } else {
        logger.log("warn", { ubicacion: filename, token: token, message: "La caja se abrira automaticamente por primera vez" });
        res.status(409).send("La caja se abrira automaticamente por primera vez");
      }
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(409).send("Sin caja");
    });
};

exports.obtenerSaldosCajaAnterior = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      //OBTENER DATOS DE CAJA DESDE db
      models.caja_trabajo
        .findAll({
          limit: 1,
          order: [["createdAt", "DESC"]],
          where: {
            caja_codigo: usuario.caja_codigo,
            [Op.not]: {
              fecha_trabajo: Date.now()
            }
          }
        })
        .then(cajaTrabajo => {
          cajaTrabajo = cajaTrabajo[0];
          if (cajaTrabajo.estado_caja) {
            if (cajaTrabajo.estado_caja === "ABIERTO") {
              //sumar todos los ingresos y egresos de todas la monedas
              const fechaTrabajo = cajaTrabajo.fecha_trabajo.split("-");
              const yyyy = fechaTrabajo[0];
              const mm = fechaTrabajo[1];
              const dd = fechaTrabajo[2];
              const fecha = `${yyyy}-${mm}-${dd}`;

              models.sequelize
                .query(`select * from obtener_saldos_caja(:fechaTrabajo, :cajacodigo)`, {
                  replacements: {
                    fechaTrabajo: fecha,
                    cajacodigo: cajaTrabajo.caja_codigo
                  },
                  type: models.sequelize.QueryTypes.SELECT
                })
                .then(totales => {
                  totales = totales[0];
                  const saldo1bd = parseFloat(totales.Saldo1);
                  const saldo2bd = parseFloat(totales.Saldo2);
                  const saldo3bd = parseFloat(totales.Saldo3);
                  res.json({
                    fecha_trabajo: cajaTrabajo.fecha_trabajo,
                    estado_caja: "ABIERTO",
                    saldo1: saldo1bd.toString(),
                    saldo2: saldo2bd.toString(),
                    saldo3: saldo3bd.toString()
                  });
                })
                .catch(err => {
                  logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
                  res.status(409).send("Error");
                });
            } else {
              res.json({
                fecha_trabajo: cajaTrabajo.fecha_trabajo,
                estado_caja: cajaTrabajo.estado_caja,
                saldo1: cajaTrabajo.Saldo1,
                saldo2: cajaTrabajo.Saldo2,
                saldo3: cajaTrabajo.Saldo3
              });
            }
          } else {
            logger.log("warn", { ubicacion: filename, token: token, message: "Error no existe caja" });
            res.status(409).send("Error no existe caja");
          }
        });
    });
  });
};

exports.verificarSaldos = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);

      //OBTENER DATOS DE CAJA DESDE db
      models.caja_trabajo
        .findAll({
          limit: 1,
          order: [["createdAt", "DESC"]],
          where: {
            caja_codigo: usuario.caja_codigo
          }
        })
        .then(cajaTrabajo => {
          cajaTrabajo = cajaTrabajo[0];
          const fecha = cajaTrabajo.fecha_trabajo;

          models.sequelize
            .query(`select * from obtener_saldos_caja(:fechaTrabajo, :cajacodigo)`, {
              replacements: {
                fechaTrabajo: fecha,
                cajacodigo: cajaTrabajo.caja_codigo
              },
              type: models.sequelize.QueryTypes.SELECT
            })
            .then(totales => {
              totales = totales[0];
              const saldo1bd = parseFloat(totales.Saldo1);
              const saldo2bd = parseFloat(totales.Saldo2);
              const saldo3bd = parseFloat(totales.Saldo3);
              if (saldo1bd === req.body.Saldo1 && saldo2bd === req.body.Saldo2 && saldo3bd === req.body.Saldo3) {
                res.json({
                  verificado: true
                });
              } else {
                res.json({
                  verificado: false
                });
              }
            })
            .catch(err => {
              logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
              res.status(409).send(`Error `);
            });
        });
    });
  });
};

exports.obtenerSaldosFecha = (req, res) => {
  var redis = req.app.get("redis");
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      const cajaCodigo = req.query.caja_codigo ? req.query.caja_codigo : usuario.caja_codigo;
      const hoy = new Date();
      const yyyy = hoy.getFullYear();
      const mm = ("0" + (hoy.getMonth() + 1)).slice(-2);
      const dd = ("0" + hoy.getDate()).slice(-2);
      const fechaHoy = `${yyyy}-${mm}-${dd}`;
      const fechaTrabajo = req.query.fecha_trabajo ? req.query.fecha_trabajo : fechaHoy;
      //OBTENER DATOS DE CAJA DESDE db
      models.caja_trabajo
        .findAll({
          limit: 1,
          order: [["createdAt", "DESC"]],
          where: {
            caja_codigo: cajaCodigo,
            fecha_trabajo: fechaTrabajo
          }
        })
        .then(cajaTrabajo => {
          cajaTrabajo = cajaTrabajo[0];

          if (cajaTrabajo) {
            if (cajaTrabajo.estado_caja === "ABIERTO") {
              //sumar todos los ingresos y egresos de todas la monedas
              models.sequelize
                .query(`select * from obtener_saldos_caja(:fechaTrabajo, :cajacodigo)`, {
                  replacements: {
                    fechaTrabajo: fechaTrabajo,
                    cajacodigo: cajaTrabajo.caja_codigo
                  },
                  type: models.sequelize.QueryTypes.SELECT
                })
                .then(totales => {
                  totales = totales[0];
                  const saldo1bd = parseFloat(totales.Saldo1);
                  const saldo2bd = parseFloat(totales.Saldo2);
                  const saldo3bd = parseFloat(totales.Saldo3);
                  res.json({
                    fecha_trabajo: cajaTrabajo.fecha_trabajo,
                    estado_caja: "ABIERTO",
                    saldo1: saldo1bd.toString(),
                    saldo2: saldo2bd,
                    saldo3: saldo3bd
                  });
                })
                .catch(err => {
                  logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
                  res.status(409).send("Error");
                });
            } else {
              res.json({
                fecha_trabajo: cajaTrabajo.fecha_trabajo,
                estado_caja: cajaTrabajo.estado_caja,
                saldo1: cajaTrabajo.Saldo1,
                saldo2: cajaTrabajo.Saldo2,
                saldo3: cajaTrabajo.Saldo3
              });
            }
          } else {
            logger.log("warn", { ubicacion: filename, token: token, message: "Error no existe caja" });
            res.status(409).send("Error no existe caja");
          }
        });
    });
  });
};

exports.buscar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.caja_trabajo
    .findOne({
      where: {
        fecha_trabajo: req.params.fecha_trabajo,
        caja_codigo: req.params.caja_codigo
      }
    })
    .then(objeto => {
      res.json(objeto);
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
  models.caja_trabajo
    .update(
      {
        usuario_apertura: req.body.usuario_apertura,
        fecha_hora_apertura: req.body.fecha_hora_apertura,
        fecha_hora_cierre: req.body.fecha_hora_cierre,
        usurio_cierre: req.body.usurio_cierre,
        estado_caja: req.body.estado_caja,
        Saldo1: req.body.Saldo1,
        Saldo2: req.body.Saldo2,
        Saldo3: req.body.Saldo3
      },
      {
        where: {
          fecha_trabajo: req.params.fecha_trabajo,
          caja_codigo: req.params.caja_codigo
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
  models.caja_trabajo
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
  models.caja_trabajo
    .findAll({
      where: {
        caja_codigo: req.params.caja_codigo || req.query.caja_codigo,
        usuario_apertura: req.params.usuario || req.query.usuario_apertura,
        usuario_cierre: req.query.usuario_cierre
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
