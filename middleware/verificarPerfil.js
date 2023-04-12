const jwt = require("jsonwebtoken");
const key = require("../config/key");
const models = require("../models");
var filename = module.filename.split("/").slice(-1);

//VERIFICAR SI SE ENCUENTRA LOGUEADO
const verificarPerfil = nivel => {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization.split(" ")[1]; //OBTIWNE EL TOKEN
      var logger = req.app.get("winston"); //LALLAMA AL LOGGER
      jwt.verify(token, key.tokenKey, function(err, tokenDecodificado) {
        if (tokenDecodificado) {
          var redis = req.app.get("redis"); //LLAMA A REDIS
          let usuario_codigo = tokenDecodificado.id;

          redis.get(usuario_codigo, function(err, usuario) {
            usuario = JSON.parse(usuario);
            redis.get("perfil-" + usuario.perfil_codigo, (err, perfil) => {
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
                      next();
                    } else {
                      logger.log("warn", { ubicacion: filename, token: token, message: "Usted no tiene acceso a este modulo" });
                      res.status(401).send("Usted no tiene acceso a este modulo");
                    }
                    return;
                  }
                });
              } else {
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
                    //guardarPerfil(redis, perfilBD);
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
                          next();
                        } else {
                          logger.log("warn", { ubicacion: filename, token: token, message: "Usted no tiene acceso a este modulo" });
                          res.status(401).send("Usted no tiene acceso a este modulo");
                        }
                        return;
                      }
                    });
                  });
              }
            });
          });
        } else if (err) {
          logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
          res.status(409).send("token invalido");
        }
      });
    } catch (e) {
      logger.log("error", { ubicacion: filename, token: token, e });
      res.status(409).send("falta token");
    }
  };
};

module.exports = verificarPerfil;
