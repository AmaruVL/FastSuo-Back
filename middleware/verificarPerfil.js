const jwt = require("jsonwebtoken");
const key = require("../config/key");
const models = require("../models");
var filename = module.filename.split("/").slice(-1);

const verificarNivelPermisos = (
  nivel,
  listaMenusAccesos,
  token,
  logger,
  request,
  response,
  next,
) => {
  const menuAcceso = listaMenusAccesos.ListaMenu.find(itemMenu => {
    //nivel de la ruta
    const nivelRuta = parseInt(itemMenu.nivel);
    //obtiene el nombre del modulo de la url segun el nivel
    const moduloUrl = request.originalUrl.split("/")[nivelRuta];
    //modulo del perfil
    const modulo = itemMenu.tipo_modulo;
    //verificar si el modulo al que se desea ingresar
    return moduloUrl == modulo;
  });
  // No tiene permiso a modulo
  if (!menuAcceso) {
    logger.log("warn", {
      ubicacion: filename,
      token: token,
      message: "Usted no tiene acceso a este modulo",
    });
    response.status(401).send("Usted no tiene acceso a este modulo");
    return;
  }
  //verificar el nivel al que se desea entrar
  const nivelAccesoPerfil = menuAcceso.lista_menu.nivel_acceso;
  if (nivel > nivelAccesoPerfil) {
    logger.log("warn", {
      ubicacion: filename,
      token: token,
      message: "Usted no tiene acceso a este modulo",
    });
    response.status(401).send("Usted no tiene acceso a este modulo");
    return;
  }
  next();
};

//VERIFICAR SI EL PERFIL PUEDE ACCEDER A UN MODULO
const verificarPerfil = nivel => {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization.split(" ")[1]; //OBTIWNE EL TOKEN
      var logger = req.app.get("winston"); //LALLAMA AL LOGGER
      jwt.verify(token, key.tokenKey, function (err, tokenDecodificado) {
        if (!tokenDecodificado || err) {
          logger.log("error", {
            ubicacion: filename,
            token: token,
            message: { mensaje: err.message, tracestack: err.stack },
          });
          res.status(409).send("token invalido");
        }
        var redis = req.app.get("redis"); //LLAMA A REDIS
        let usuario_codigo = tokenDecodificado.id;

        redis.get(usuario_codigo, function (err, usuario) {
          usuario = JSON.parse(usuario);
          redis.get("perfil-" + usuario.perfil_codigo, (err, perfil) => {
            if (perfil) {
              perfil = JSON.parse(perfil);
              verificarNivelPermisos(nivel, perfil, token, logger, req, res, next);
            } else {
              //Buscar perfil en BD
              models.perfil
                .findOne({
                  where: {
                    perfil_codigo: usuario.perfil_codigo,
                  },
                  include: ["ListaMenu"],
                })
                .then(perfilBD => {
                  //GUARDAR PERFIL EN REDIS
                  redis.set(
                    "perfil-" + usuario.perfil_codigo,
                    JSON.stringify({
                      ListaMenu: perfilBD.ListaMenu,
                    }),
                  );
                  verificarNivelPermisos(nivel, perfilBD, token, logger, req, res, next);
                });
            }
          });
        });
      });
    } catch (e) {
      logger.log("error", { ubicacion: filename, token: token, e });
      res.status(409).send("falta token");
    }
  };
};

module.exports = verificarPerfil;
