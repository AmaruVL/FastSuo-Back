const Sequelize = require("sequelize");
const models = require("../models");
const utils = require("../services/utils");

var filename = module.filename.split("/").slice(-1);

exports.crear = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.cuenta_corriente
    .create({
      id_cuenta: req.body.id_cuenta,
      entidad_codigo: req.body.entidad_codigo,
      id_cliente: req.body.id_cliente,
      tipo_cta: req.body.tipo_cta,
      tipo_cta_bancaria: req.body.tipo_cta_bancaria,
      tasa_interes_mensual: req.body.tasa_interes_mensual,
      cta_observacion: req.body.cta_observacion,
      estado_registro: req.body.estado_registro,
      oficina_codigo_src: req.body.oficina_codigo_src,
      es_servicio: req.body.es_servicio,
      credito_maximo_soles: req.body.credito_maximo_soles,
      credito_maximo_dolares: req.body.credito_maximo_dolares,
      credito_maximo_otros: req.body.credito_maximo_otros
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
  models.cuenta_corriente
    .findByPk(req.params.id_cuenta)
    .then(objeto => {
      res.json(objeto);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send(err);
    });
};

exports.buscarCuentaCliente = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      models.cuenta_corriente
        .findAll({
          where: {
            id_cliente: req.params.id_cliente,
            oficina_codigo_src: usuario.oficina_codigo
          },
          include: [
            {
              attributes: ["razon_social"],
              model: models.cliente_proveedor,
              as: "cliente",
              required: false
            }
          ]
        })
        .then(async objeto => {
          if (objeto.length > 0) {
            let saldos = [];
            for (let i = 0; i < objeto.length; i++) {
              const cuenta = objeto[i];
              const s = await getSaldoCuentaCorrienteClientes(cuenta.id_cuenta);
              saldos.push(s);
            }
            res.json({ cuentas: objeto, saldos: saldos });
          } else {
            res.status(409).send("No existe cuenta");
          }
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
          res.status(412).send(err.message);
        });
    });
  });
};

exports.actualizar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.cuenta_corriente
    .update(
      {
        entidad_codigo: req.body.entidad_codigo,
        id_cliente: req.body.id_cliente,
        tipo_cta: req.body.tipo_cta,
        tipo_cta_bancaria: req.body.tipo_cta_bancaria,
        tasa_interes_mensual: req.body.tasa_interes_mensual,
        cta_observacion: req.body.cta_observacion,
        estado_registro: req.body.estado_registro,
        oficina_codigo_src: req.body.oficina_codigo_src,
        es_servicio: req.body.es_servicio,
        credito_maximo_soles: req.body.credito_maximo_soles,
        credito_maximo_dolares: req.body.credito_maximo_dolares,
        credito_maximo_otros: req.body.credito_maximo_otros
      },
      {
        where: {
          id_cuenta: req.params.id_cuenta
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
      res.status(412).send(err);
    });
};

exports.desactivar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.cuenta_corriente
    .update(
      {
        estado_registro: req.body.estado_registro
      },
      {
        where: {
          id_cuenta: req.params.id_cuenta
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
      res.status(412).send(err);
    });
};

exports.listar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.cuenta_corriente
    .findAll({
      include: [
        {
          attributes: ["entidad_razon_social"],
          model: models.entidad_financiera_servicios,
          as: "entidad_financiera",
          required: false
        },
        {
          attributes: ["oficina_nombre"],
          model: models.oficina,
          as: "oficina",
          required: false
        },
        {
          attributes: ["razon_social"],
          model: models.cliente_proveedor,
          as: "cliente",
          required: false
        }
      ]
    })
    .then(lista => {
      res.json(lista);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send(err);
    });
};

exports.correlativo = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  const oficina_codigo = req.params.oficina_codigo;
  const tipo_cta = req.params.tipo_cta;
  models.sequelize
    .query(
      `select coalesce (MAX(id_cuenta::BIGINT),0) as cantidad ` +
        `from cuenta_corriente ` +
        `where oficina_codigo_src  = :oficina_codigo and tipo_cta  = :tipo_cta and es_servicio = false;`,
      {
        replacements: {
          oficina_codigo: oficina_codigo,
          tipo_cta: tipo_cta
        },
        type: models.sequelize.QueryTypes.SELECT
      }
    )
    .then(cantidad => {
      cantidad = parseInt(cantidad[0].cantidad);
      let correlativo = "";
      const oficinaTipo = oficina_codigo.substring(0, 3);
      const nroOficina = oficina_codigo.substring(3);
      if (cantidad < 999999) {
        const c1 = oficinaTipo === "OFP" ? "1" : oficinaTipo === "AFI" ? "2" : "3";
        const c2 = nroOficina;
        const c3 = tipo_cta === "CREDITO" ? "1" : tipo_cta === "DEBITO" ? "0" : "2";
        const c4 = cantidad.toString().padStart(6, "0");
        correlativo = c1 + c2 + c3 + c4;
      } else {
        correlativo = cantidad;
      }
      res.json({ correlativo: parseInt(correlativo) + 1 });
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(409).send(err.message);
    });
};

exports.listarcuentasservicios = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, async (err, usuario) => {
      usuario = JSON.parse(usuario);

      const usuarioCaja = await models.cuenta_usuario.findOne({
        where: {
          usuario: tokenDecodificado.id
        },
        include: [
          {
            attributes: ["oficina_codigo"],
            model: models.caja
          }
        ]
      });

      models.cuenta_corriente
        .findAll({
          where: {
            es_servicio: true,
            oficina_codigo_src: usuarioCaja.caja.oficina_codigo
          },
          include: [
            {
              attributes: ["entidad_razon_social"],
              model: models.entidad_financiera_servicios,
              as: "entidad_financiera",
              required: false
            },
            {
              attributes: ["oficina_nombre"],
              model: models.oficina,
              as: "oficina",
              required: false
            }
          ]
        })
        .then(lista => {
          res.json(lista);
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
          res.status(412).send(err);
        });
    });
  });
};

exports.listarcuentascorrientes = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, async (err, usuario) => {
      usuario = JSON.parse(usuario);

      models.cuenta_corriente
        .findAll({
          where: {
            es_servicio: false
          },
          include: [
            {
              attributes: ["razon_social"],
              model: models.cliente_proveedor,
              as: "cliente",
              required: false
            },
            {
              attributes: ["oficina_nombre"],
              model: models.oficina,
              as: "oficina",
              required: false
            }
          ]
        })
        .then(lista => {
          res.json(lista);
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
          res.status(412).send(err);
        });
    });
  });
};

exports.listarcuentasserviciosall = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      models.cuenta_corriente
        .findAll({
          where: {
            es_servicio: true
          },
          include: [
            {
              attributes: ["entidad_razon_social"],
              model: models.entidad_financiera_servicios,
              as: "entidad_financiera",
              required: false
            },
            {
              attributes: ["oficina_nombre"],
              model: models.oficina,
              as: "oficina",
              required: false
            }
          ]
        })
        .then(lista => {
          res.json(lista);
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
          res.status(412).send(err);
        });
    });
  });
};

exports.eliminar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.cuenta_corriente
    .destroy({
      where: {
        id_cuenta: req.params.id_cuenta
      }
    })
    .then(respuesta => {
      res.json({
        mensaje: respuesta
      });
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(409).send(err);
    });
};

function getSaldoCuentaCorrienteClientes(id_cuenta) {
  return new Promise((resolve, reject) => {
    models.sequelize
      .query(`select * from saldos_cuenta_clientes(:id_cuenta);`, {
        replacements: {
          id_cuenta: id_cuenta
        },
        type: models.sequelize.QueryTypes.SELECT,
        nest: true
      })
      .then(saldos => {
        if (saldos) {
          const saldoSoles = saldos[0].depositosoles - saldos[0].retirosoles;
          const saldoDolares = saldos[0].depositodolares - saldos[0].retirodolares;
          resolve({ saldoSoles, saldoDolares });
        } else {
          reject("No existe cuenta");
        }
      })
      .catch(err => {
        reject(err);
      });
  });
}
