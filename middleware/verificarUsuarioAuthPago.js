var bcrypt = require("bcryptjs");
const models = require("../models");
var filename = module.filename.split("/").slice(-1);

//VERIFICAR SI SE ENCUENTRA LOGUEADO
exports.verificar = () => {
  return (req, res, next) => {
    try {
      var redis = req.app.get("redis");
      var logger = req.app.get("winston");
      models.cuenta_usuario
        .findOne({
          where: {
            usuario: req.body.usuario
          }
        })
        .then(usuario => {
          if (usuario) {
            if (usuario.estado_registro === false) {
              logger.log("warn", { ubicacion: filename, message: "El usuario se encuentra desactivado" });
              res.status(409).send("El usuario se encuentra desactivado");
              return;
            } else {
              bcrypt.compare(req.body.contrasena, usuario.contrasena, async (err, respuesta) => {
                if (respuesta) {
                  redis.get(`perfil-${usuario.perfil_codigo}`, (err, perfilCodigo) => {
                    if (perfilCodigo == null) {
                      models.perfil
                        .findOne({
                          where: {
                            perfil_codigo: usuario.perfil_codigo
                          },
                          include: ["ListaMenu"]
                        })
                        .then(perfilBD => {
                          //GUARDAR PERFIL EN REDIS
                          redis.set(
                            "perfil-" + usuario.perfil_codigo,
                            JSON.stringify({
                              ListaMenu: perfilBD.ListaMenu
                            })
                          );

                          const modulo = perfilBD.ListaMenu.find(item => item.tipo_modulo == "autorizaroperaciones");
                          if (modulo) {
                            if (modulo.lista_menu.nivel_acceso >= 5) {
                              next();
                            } else {
                              logger.log("warn", { ubicacion: filename, message: "Este usuario no puede autorizar la operación" });
                              res.status(409).send("Este usuario no puede autorizar la operación");
                            }
                          } else {
                            logger.log("warn", { ubicacion: filename, message: "Este usuario no puede autorizar la operación" });
                            res.status(409).send("Este usuario no puede autorizar la operación");
                          }
                        });
                    } else {
                      perfilCodigo = JSON.parse(perfilCodigo);
                      const modulo = perfilCodigo.ListaMenu.find(item => item.tipo_modulo == "autorizaroperaciones");
                      if (modulo) {
                        if (modulo.lista_menu.nivel_acceso >= 5) {
                          next();
                        } else {
                          logger.log("warn", { ubicacion: filename, message: "Este usuario no puede autorizar la operación" });
                          res.status(409).send("Este usuario no puede autorizar la operación");
                        }
                      } else {
                        logger.log("warn", { ubicacion: filename, message: "Este usuario no puede autorizar la operación" });
                        res.status(409).send("Este usuario no puede autorizar la operación");
                      }
                    }
                  });
                } else {
                  logger.log("warn", { ubicacion: filename, message: `Contraseña incorrecta` });
                  res.status(409).send("Contraseña incorrecta");
                }
              });
            }
          } else {
            logger.log("warn", { ubicacion: filename, message: `Usuario no existe` });
            res.status(409).send("Usuario no existe");
          }
        });
    } catch (error) {
      logger.log("error", { ubicacion: filename, message: error.message });
      res.status(409).send(error.message);
    }
  };
};
