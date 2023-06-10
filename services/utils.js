const jwt = require("jsonwebtoken");
const key = require("../config/key");
const models = require("../models");
const cache = require("../config/cache");

exports.decodeToken = (token, callback) => {
  jwt.verify(token, key.tokenKey, function (err, decoded) {
    if (!err) {
      callback(decoded);
    } else {
      callback(false);
    }
  });
};

exports.verificarPerfil = (req, nivel) => {
  return new Promise((resolve, reject) => {
    try {
      const token = req.headers.authorization.split(" ")[1];
      var logger = req.app.get("winston");
      jwt.verify(token, key.tokenKey, function (err, payload) {
        if (payload) {
          let usuario = cache.getValue(payload.id);
          usuario = JSON.parse(usuario);
          let perfil = cache.getValue("perfil-" + usuario.perfil_codigo);
          if (perfil) {
            perfil = JSON.parse(perfil);
            perfil.ListaMenu.forEach(ItemMenu => {
              //nivel de la ruta
              const nivelRuta = parseInt(ItemMenu.nivel);
              //obtiene el nombre del modulo de la url segun el nivel
              const moduloUrl = req.originalUrl.split("/")[nivelRuta];
              //modulo del perfil
              const modulo = ItemMenu.tipo_modulo;
              //verificar si el modulo al que se desea ingresar
              if (moduloUrl == modulo) {
                //verificar el nivel al que se desea entrar
                const nivelAccesoPerfil = ItemMenu.lista_menu.nivel_acceso;
                if (nivel <= nivelAccesoPerfil) {
                  resolve(true);
                } else {
                  reject(false);
                }
              }
            });
          } else {
            models.perfil
              .findOne({
                where: {
                  perfil_codigo: usuario.perfil_codigo,
                },
                include: ["ListaMenu"],
              })
              .then(perfilBD => {
                //GUARDAR PERFIL EN CACHE
                cache.setValue(
                  "perfil-" + usuario.perfil_codigo,
                  JSON.stringify({
                    ListaMenu: perfilBD.ListaMenu,
                  }),
                );
                perfilBD.ListaMenu.forEach(ItemMenu => {
                  //nivel de la ruta
                  const nivelRuta = parseInt(ItemMenu.nivel);
                  //obtiene el nombre del modulo de la url segun el nivel
                  const moduloUrl = req.originalUrl.split("/")[nivelRuta];
                  //modulo del perfil
                  const modulo = ItemMenu.tipo_modulo;
                  //verificar si el modulo al que se desea ingresar
                  if (moduloUrl == modulo) {
                    //verificar el nivel al que se desea entrar
                    const nivelAccesoPerfil = ItemMenu.lista_menu.nivel_acceso;
                    if (nivel <= nivelAccesoPerfil) {
                      resolve(true);
                    } else {
                      reject(false);
                    }
                  }
                });
              });
          }
        } else if (err) {
          logger.log("error", {
            ubicacion: filename,
            token: token,
            message: { mensaje: err.message, tracestack: err.stack },
          });
          reject(false);
        }
      });
    } catch (e) {
      logger.log("error", { ubicacion: filename, token: token, e });
      reject(false);
    }
  });
};
