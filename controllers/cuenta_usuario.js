const Sequelize = require("sequelize");
const models = require("../models");
const DeviceDetector = require("node-device-detector");
const DEVICE_TYPE = require("node-device-detector/parser/const/device-type");
var bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const key = require("../config/key");
const utils = require("../services/utils");
const cache = require("../config/cache");
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
      tipo_arqueo: req.body.tipo_arqueo,
    })
    .then(objeto => {
      res.json(objeto);
    })
    .catch(err => {
      logger.log("error", {
        ubicacion: filename,
        token: token,
        message: { mensaje: err.message, tracestack: err.stack },
      });
      res.status(412).send(err);
    });
};

exports.validar = (req, res) => {
  var logger = req.app.get("winston");

  var socket = req.app.get("socketio");
  const token = req.header("Authorization").split(" ");
  const detector = new DeviceDetector();
  const userAgent = req.headers["user-agent"];
  const result = detector.detect(userAgent);
  const isTabled =
    result.device && [DEVICE_TYPE.TABLET].indexOf(result.device.type) !== -1;
  const isMobile =
    result.device &&
    [DEVICE_TYPE.SMARTPHONE, DEVICE_TYPE.FEATURE_PHONE].indexOf(result.device.type) !==
      -1;
  const isPhablet =
    result.device && [DEVICE_TYPE.PHABLET].indexOf(result.device.type) !== -1;
  let esMobil = false;
  if (isTabled || isMobile || isPhablet) {
    esMobil = true;
  }

  models.cuenta_usuario
    .findOne({
      where: {
        usuario: req.body.usuario,
      },
    })
    .then(async usuario => {
      if (usuario) {
        if (usuario.estado_registro === false) {
          logger.log("warn", {
            ubicacion: filename,
            message: "Usuario bloqueado, contacte con el administrador del sistema",
          });
          res
            .status(400)
            .send("Usuario bloqueado, contacte con el administrador del sistema");
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
                  message: "No se puede ingresar al sistema - 01",
                });
                res.status(400).send("No se puede ingresar al sistema - 01");
                return;
              }
            } else {
              if (token[0]) {
                await models.cuenta_usuario.update(
                  {
                    pc_sn: token[0],
                  },
                  {
                    where: {
                      usuario: req.body.usuario,
                    },
                  },
                );
                usuario["pc_sn"] = token[0];
              } else {
                logger.log("warn", {
                  ubicacion: filename,
                  message: "No se puede ingresar al sistema - 02",
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
                    pc_sn: token[0],
                  },
                  {
                    where: {
                      usuario: req.body.usuario,
                    },
                  },
                );
                usuario["pc_sn"] = token[0];
              }
            } else {
              if (token[0] === "nt" || usuario.pc_sn === token[0]) {
                console.log("logueado");
              } else {
                logger.log("warn", {
                  ubicacion: filename,
                  message: "No se puede ingresar al sistema - 03",
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
                    pc_sn: token[1],
                  },
                  {
                    where: {
                      usuario: req.body.usuario,
                    },
                  },
                );
                usuario["pc_sn"] = token[1];
              } else {
                logger.log("warn", {
                  ubicacion: filename,
                  message: "No se puede ingresar al sistema - 04",
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
                    message: "Dispositivo no reconocido - 05",
                  });
                  res.status(400).send("Dispositivo no reconocido - 05");
                  return;
                }
              } else {
                logger.log("warn", {
                  ubicacion: filename,
                  message: "No se puede ingresar al sistema - 06",
                });
                res.status(400).send("No se puede ingresar al sistema - 06");
                return;
              }
            }
          } else if (usuario.modo_conexion !== 4) {
            logger.log("warn", {
              ubicacion: filename,
              message: "No se puede ingresar al sistema - 07",
            });
            res.status(400).send("No se puede ingresar al sistema - 07");
            return;
          }

          bcrypt.compare(
            req.body.contrasena,
            usuario.contrasena,
            async (err, respuesta) => {
              if (respuesta) {
                var inicio = Date.now();
                var end = new Date();
                const fin = end.setHours(23, 59, 59, 999);
                const total = Math.trunc((fin - inicio) / 1000);
                const token = jwt.sign(
                  {
                    id: usuario.usuario,
                    n: usuario.usuario_nombre,
                  },
                  key.tokenKey,
                  {
                    expiresIn: total,
                  },
                );
                //obtener perfil de usuario
                const perfil = await models.perfil.findOne({
                  where: {
                    perfil_codigo: usuario.perfil_codigo,
                  },
                  include: ["ListaMenu"],
                });
                //guardar usuario en CACHE
                let usuarioCache = cache.getValue(usuario.usuario);
                usuarioCache = JSON.parse(usuarioCache);
                if (usuarioCache !== null && typeof usuarioCache == "object") {
                  if (esMobil) {
                    usuarioCache["token_mobil"] = token;
                    socket.emit(usuario.usuario + "mobil", result.device);
                  } else {
                    usuarioCache["token"] = token;
                  }
                  cache.setValue(usuario.usuario, JSON.stringify(usuarioCache), total);
                } else {
                  if (esMobil) {
                    cache.setValue(
                      usuario.usuario,
                      JSON.stringify({
                        token_mobil: token,
                        perfil_codigo: usuario.perfil_codigo,
                        caja_codigo: usuario.caja_codigo,
                        estado_registro: usuario.estado_registro,
                        modo_conexion: usuario.modo_conexion,
                        pc_sn: usuario.pc_sn,
                      }),
                      total,
                    );
                  } else {
                    cache.setValue(
                      usuario.usuario,
                      JSON.stringify({
                        token: token,
                        perfil_codigo: usuario.perfil_codigo,
                        caja_codigo: usuario.caja_codigo,
                        estado_registro: usuario.estado_registro,
                        modo_conexion: usuario.modo_conexion,
                        pc_sn: usuario.pc_sn,
                      }),
                      total,
                    );
                  }
                }

                //guardar perfil en cache
                cache.setValue(
                  "perfil-" + usuario.perfil_codigo,
                  JSON.stringify({
                    ListaMenu: perfil.ListaMenu,
                  }),
                );

                res.json({
                  token: token,
                  _p: perfil.ListaMenu,
                });
              } else {
                let val = cache.incrValue(req.body.usuario);
                if (!val) {
                  //si no existe val
                  cache.setValue(req.body.usuario, 1);
                  val = 1;
                }
                if (val >= 3) {
                  //bloquear usuario
                  logger.log("warn", {
                    ubicacion: filename,
                    message: `Usuario ${req.body.usuario} bloqueado, contacte con su supervisor.`,
                  });
                  res.status(400).send("Usuario bloqueado, contacte con su supervisor.");
                  models.cuenta_usuario.update(
                    {
                      estado_registro: false,
                    },
                    {
                      where: {
                        usuario: req.body.usuario,
                      },
                    },
                  );
                } else {
                  let total = 3 - parseInt(val);
                  logger.log("warn", {
                    ubicacion: filename,
                    message: `Usuario ${req.body.usuario} o contraseña inválida, intentos restantes: ${total}`,
                  });
                  res
                    .status(400)
                    .send(`Usuario o contraseña inválida, intentos restantes: ${total}`);
                }
              }
            },
          );
        }
      } else {
        logger.log("warn", {
          ubicacion: filename,
          message: `Usuario no existe ${req.body.usuario}`,
        });
        res.status(409).send(`Usuario no existe`);
      }
    })
    .catch(err => {
      logger.log("error", {
        ubicacion: filename,
        token: token,
        message: { mensaje: err.message, tracestack: err.stack },
      });
      res.status(400).send("Usuario no existe");
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
        message: { mensaje: err.message, tracestack: err.stack },
      });
      res.json({
        error: err.errors,
      });
    });
};

exports.actualizar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  let obj = {};
  req.body.contrasena
    ? (obj = {
        contrasena: bcrypt.hashSync(req.body.contrasena, 8),
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
        tipo_arqueo: req.body.tipo_arqueo,
      },
      {
        where: {
          usuario: req.params.usuario,
        },
      },
    )
    .then(filasAfectadas => {
      let usuario = req.params.usuario;
      let usuarioXeliminar = cache.getValue(usuario);
      usuarioXeliminar = JSON.parse(usuarioXeliminar);
      if (usuarioXeliminar !== null) {
        const cajaUsuario = usuarioXeliminar.caja_codigo;
        //ELIMINAR DATOS DEL USUARIO DE CACHE
        cache.delValue(usuario);
        //ELIMINAR CAJA SI EXISTIERA
        cajaUsuario ? cache.delValue(cajaUsuario) : null;
        res.json(filasAfectadas);
      } else {
        res.json(filasAfectadas);
      }
    })
    .catch(err => {
      logger.log("error", {
        ubicacion: filename,
        token: token,
        message: { mensaje: err.message, tracestack: err.stack },
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
        estado_registro: req.body.estado_registro,
      },
      {
        where: {
          usuario: req.params.usuario,
        },
      },
    )
    .then(filasAfectadas => {
      let usuario = req.params.usuario;
      let usuarioXeliminar = cache.getValue(usuario);
      usuarioXeliminar = JSON.parse(usuarioXeliminar);
      if (usuarioXeliminar !== null) {
        const cajaUsuario = usuarioXeliminar.caja_codigo;
        //ELIMINAR DATOS DEL USUARIO DE CACHE
        cache.delValue(usuario);
        //ELIMINAR CAJA SI EXISTIERA
        cajaUsuario ? cache.delValue(cajaUsuario) : null;
        res.json(filasAfectadas);
      } else {
        res.json(filasAfectadas);
      }
    })
    .catch(err => {
      logger.log("error", {
        ubicacion: filename,
        token: token,
        message: { mensaje: err.message, tracestack: err.stack },
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
          usuario: tokenDecodificado.id,
        },
      })
      .then(usuario => {
        bcrypt.compare(
          req.body.contrasena_old,
          usuario.contrasena,
          async (err, respuesta) => {
            if (respuesta) {
              models.cuenta_usuario
                .update(
                  {
                    contrasena: bcrypt.hashSync(req.body.contrasena, 8),
                    contrasena_old: req.body.contrasena_old,
                  },
                  {
                    where: {
                      usuario: tokenDecodificado.id,
                    },
                  },
                )
                .then(filasAfectadas => {
                  let usuarioXeliminar = cache.getValue(tokenDecodificado.id);
                  usuarioXeliminar = JSON.parse(usuarioXeliminar);
                  if (usuarioXeliminar !== null) {
                    const cajaUsuario = usuarioXeliminar.caja_codigo;
                    //ELIMINAR DATOS DEL USUARIO DE CACHE
                    cache.delValue(tokenDecodificado.id);
                    //ELIMINAR CAJA SI EXISTIERA
                    cajaUsuario ? cache.delValue(cajaUsuario) : null;
                    res.json(filasAfectadas);
                  }
                })
                .catch(err => {
                  logger.log("error", {
                    ubicacion: filename,
                    token: token,
                    message: { mensaje: err.message, tracestack: err.stack },
                  });
                  res.status(412).send("No se pudo cambiar la contraseña de usuario");
                });
            } else {
              logger.log("warn", {
                ubicacion: filename,
                token: token,
                message: "La contraseña actual no es válida",
              });
              res.status(409).send("La contraseña actual no es válida");
            }
          },
        );
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
        "pregunta_secreta",
        "createdAt",
        "puede_editar_DT",
        "pc_sn",
        "modo_conexion",
        "tipo_arqueo",
      ],
      order: [["usuario_nombre", "ASC"]],
    })
    .then(lista => {
      res.json(lista);
    })
    .catch(err => {
      logger.log("error", {
        ubicacion: filename,
        token: token,
        message: { mensaje: err.message, tracestack: err.stack },
      });
      res.json({
        error: err.errors,
      });
    });
};

exports.eliminar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.cuenta_usuario
    .destroy({
      where: {
        usuario: req.params.usuario,
      },
    })
    .then(respuesta => {
      res.json({
        mensaje: respuesta,
      });
    })
    .catch(err => {
      logger.log("error", {
        ubicacion: filename,
        token: token,
        message: { mensaje: err.message, tracestack: err.stack },
      });
      res.status(409).send(err);
    });
};
