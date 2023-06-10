const Sequelize = require("sequelize");
const models = require("../models");
var bcrypt = require("bcryptjs");
const utils = require("../services/utils");
const cache = require("../config/cache");
var filename = module.filename.split("/").slice(-1);

exports.crear = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  let caja_contrasena = req.body.caja_contrasena;
  if (req.body.caja_contrasena == "") {
    caja_contrasena = "admin";
  }
  models.caja
    .create({
      caja_codigo: req.body.caja_codigo,
      caja_nombre: req.body.caja_nombre,
      direccion_ip_acceso: req.body.direccion_ip_acceso || "127.10.10.1",
      caja_contrasena: bcrypt.hashSync(caja_contrasena, 8),
      almacen_defecto: req.body.almacen_defecto,
      caja_bitacora: `${Date.now()}-Creacion de caja`,
      estado_registro: req.body.estado_registro,
      oficina_codigo: req.body.oficina_codigo,
      verificar_saldo_caja: req.body.verificar_saldo_caja || "VERIFICAR"
    })
    .then(objeto => {
      res.json(objeto);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send(err);
    });
};

exports.buscar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.caja
    .findByPk(req.params.caja_codigo, {
      attributes: ["caja_codigo", "caja_nombre", "direccion_ip_acceso", "almacen_defecto", "estado_registro", "oficina_codigo", "createdAt"]
    })
    .then(objeto => {
      res.json(objeto);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send();
    });
};

exports.actualizar = async (req, res) => {
  var redis = req.app.get("redis");
  let obj = {};
  req.body.caja_contrasena
    ? (obj = {
        caja_contrasena: bcrypt.hashSync(req.body.caja_contrasena, 8)
      })
    : null;
  const caja = await models.caja.findByPk(req.params.caja_codigo);
  let bitacora = caja.caja_bitacora;
  if (bitacora.length > 200) {
    bitacora = bitacora.substring(50);
  }
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    models.caja
      .update(
        {
          caja_nombre: req.body.caja_nombre,
          direccion_ip_acceso: req.body.direccion_ip_acceso || "127.10.10.1",
          ...obj,
          almacen_defecto: req.body.almacen_defecto,
          caja_bitacora: bitacora + "-" + tokenDecodificado.id + "act" + Date.now(),
          oficina_codigo: req.body.oficina_codigo,
          verificar_saldo_caja: req.body.verificar_saldo_caja
        },
        {
          where: {
            caja_codigo: req.params.caja_codigo
          }
        }
      )
      .then(filasAfectadas => {
        if (filasAfectadas == 1) {
          redis.get(req.params.caja_codigo, async function(err, cajaModificada) {
            cajaModificada = JSON.parse(cajaModificada);
            if (cajaModificada !== null) {
              cajaModificada.verificar_saldo_caja = req.body.verificar_saldo_caja;
              cache.setValue(req.params.caja_codigo, JSON.stringify(cajaModificada));
              res.json(filasAfectadas);
            } else {
              res.json({
                mensaje: filasAfectadas
              });
            }
          });
        }
      })
      .catch(err => {
        logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
        res.status(412).send();
      });
  });
};

exports.cambiarContrasena = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  var redis = req.app.get("redis");
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      models.caja
        .findOne({
          where: {
            caja_codigo: usuario.caja_codigo
          }
        })
        .then(caja => {
          bcrypt.compare(req.body.contrasena_old, caja.caja_contrasena, async (err, respuesta) => {
            if (respuesta) {
              models.caja
                .update(
                  {
                    caja_contrasena: bcrypt.hashSync(req.body.contrasena, 8)
                  },
                  {
                    where: {
                      caja_codigo: usuario.caja_codigo
                    }
                  }
                )
                .then(filasAfectadas => {
                  if (usuario !== null) {
                    const cajaUsuario = usuario.caja_codigo;
                    //ELIMINAR DATOS DEL USUARIO DE REDIS
                    cache.delValue(tokenDecodificado.id)
                    //ELIMINAR CAJA SI EXISTIERA
                    cajaUsuario ? cache.delValue(cajaUsuario) : null;
                    res.json(filasAfectadas);
                  }
                })
                .catch(err => {
                  logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
                  res.status(412).send("No se pudo cambiar la contraseña de caja");
                });
            } else {
              logger.log("warn", { ubicacion: filename, token: token, message: "La contraseña actual no es válida" });
              res.status(409).send("La contraseña actual no es válida");
            }
          });
        });
    });
  });
};

exports.desactivar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.caja
    .update(
      {
        estado_registro: req.body.estado_registro
      },
      {
        where: {
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
      res.status(412).send();
    });
};

exports.listar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.caja
    .findAll({
      attributes: [
        "caja_codigo",
        "caja_nombre",
        "direccion_ip_acceso",
        "almacen_defecto",
        "estado_registro",
        "oficina_codigo",
        "verificar_saldo_caja",
        "createdAt"
      ]
    })
    .then(lista => {
      res.json(lista);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send();
    });
};

exports.listarActivas = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.caja
    .findAll({
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
      where: { estado_registro: true }
    })
    .then(lista => {
      res.json(lista);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send();
    });
};

exports.listarPor = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.caja
    .findAll({
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
      where: {
        oficina_codigo: req.params.oficina_codigo || req.query.oficina_codigo
      }
    })
    .then(lista => {
      res.json(lista);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send();
    });
};

exports.eliminar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.caja
    .destroy({
      where: {
        caja_codigo: req.params.caja_codigo
      }
    })
    .then(respuesta => {
      res.json({
        mensaje: respuesta
      });
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(409).send();
    });
};
