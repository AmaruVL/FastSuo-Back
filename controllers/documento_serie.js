const Sequelize = require("sequelize");
const models = require("../models");
const moment = require("moment");
const utils = require("../services/utils");
const services = require("../services/utils");
const { getValue } = require("../config/cache");
// import services from "../services/utils";
// const services = require("")
const Op = Sequelize.Op;

var filename = module.filename.split("/").slice(-1);

exports.crear = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.documento_serie
    .create({
      documento_codigo: req.body.documento_codigo,
      documento_serie: req.body.documento_serie,
      nro_inicio: req.body.nro_inicio,
      fecha_activacion: moment().format("YYYY-MM-DD"),
      fecha_baja: req.body.fecha_baja,
      afecto: req.body.afecto,
      formato: req.body.formato,
      estado_registro: req.body.estado_registro,
      oficina_codigo: req.body.oficina_codigo,
      modulo: req.body.modulo,
    })
    .then(objeto => {
      models.documento_serie
        .findOne({
          where: {
            documento_codigo: objeto.documento_codigo,
            documento_serie: objeto.documento_serie,
          },
          attributes: [
            "oficina_codigo",
            "documento_codigo",
            "documento_serie",
            "fecha_activacion",
            "estado_registro",
            "createdAt",
          ],
          include: [
            {
              model: models.oficina,
              attributes: ["oficina_nombre"],
            },
            {
              model: models.documento,
              attributes: ["documento_descripcion"],
            },
          ],
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
          res.status(412).send(err);
        });
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

exports.crearMultiple = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  const oficinas = req.body.oficinas;
  const documentos = req.body.documentos;
  const modulos = req.body.modulos;
  const arrSeries = [];
  let documento_serie = parseInt(req.body.documento_serie);
  if (documentos.length === modulos.length) {
    for (let i = 0; i < oficinas.length; i++) {
      const oficina = oficinas[i];
      for (let j = 0; j < documentos.length; j++) {
        const documento = documentos[j];
        const modulo = modulos[j];
        arrSeries.push(
          models.documento_serie.create({
            documento_codigo: documento,
            documento_serie: documento_serie,
            nro_inicio: req.body.nro_inicio,
            fecha_activacion: moment().format("YYYY-MM-DD"),
            fecha_baja: req.body.fecha_baja,
            afecto: req.body.afecto,
            formato: req.body.formato,
            estado_registro: req.body.estado_registro,
            oficina_codigo: oficina,
            modulo: modulo,
          }),
        );
      }
      documento_serie += 1;
    }
    Promise.all(arrSeries)
      .then(resp => {
        res.json("Guardado correctamente");
      })
      .catch(err => {
        logger.log("error", {
          ubicacion: filename,
          token: token,
          message: { mensaje: err.message, tracestack: err.stack },
        });
        res.status(409).send(err);
      });
  } else {
    logger.log("warn", {
      ubicacion: filename,
      token: token,
      message: "La cantidad de documentos y modulos no coinciden",
    });
    res.status(409).send("La cantidad de documentos y modulos no coinciden");
  }
};

exports.buscar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.documento_serie
    .findOne({
      where: {
        documento_codigo: req.params.documento_codigo,
        documento_serie: req.params.documento_serie,
      },
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
      res.json({
        error: err.errors,
      });
    });
};

exports.actualizar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.documento_serie
    .update(
      {
        nro_inicio: req.body.nro_inicio,
        fechai_activacion: req.body.fechai_activacion,
        fecha_baja: req.body.fecha_baja,
        afecto: req.body.afecto,
        formato: req.body.formato,
        oficina_codigo: req.body.oficina_codigo,
        modulo: req.body.modulo,
      },
      {
        where: {
          documento_codigo: req.params.documento_codigo,
          documento_serie: req.params.documento_serie,
        },
      },
    )
    .then(filasAfectadas => {
      res.json({
        mensaje: filasAfectadas,
      });
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

exports.desactivar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.documento_serie
    .update(
      {
        estado_registro: req.body.estado_registro,
      },
      {
        where: {
          documento_codigo: req.params.documento_codigo,
          documento_serie: req.params.documento_serie,
        },
      },
    )
    .then(filasAfectadas => {
      res.json({
        mensaje: filasAfectadas,
      });
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

exports.listar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.documento_serie
    .findAll({})
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

exports.listarActivos = async (req, res) => {
  const url = req.originalUrl.split("/");
  const moduloUrl = url[2];
  let modulo = {};
  if (
    moduloUrl == "transferencias" ||
    (moduloUrl == "transferenciascentral" && url[3] == "documentoserie")
  ) {
    modulo = {
      modulo: "Transferencias",
    };
  } else if (moduloUrl == "habilitaciones") {
    modulo = {
      modulo: "Habilitaciones",
    };
  } else if (moduloUrl == "recibointerno") {
    await utils
      .verificarPerfil(req, 3)
      .then(respuesta => {
        if (respuesta) {
          modulo = {
            modulo: "Reciboingreso",
          };
        }
      })
      .catch(err => {
        console.log("NO NIETE RECINO DE INGRESO");
      });
    await utils
      .verificarPerfil(req, 4)
      .then(respuesta => {
        if (respuesta) {
          modulo = {
            [Op.or]: [
              {
                modulo: "Reciboingreso",
              },
              {
                modulo: "Reciboegreso",
              },
            ],
          };
        }
      })
      .catch(err => {
        console.log("NO TIENE RECIBO DE EGRESO");
      });
  } else if (moduloUrl === "tipocambio") {
    modulo = {
      modulo: "Tipocambio",
    };
  } else if (moduloUrl === "materiales") {
    modulo = {
      modulo: "Materiales",
    };
  } else if (
    moduloUrl === "ordenpago" ||
    moduloUrl === "pagarbancos" ||
    (moduloUrl == "transferenciascentral" && url[3] == "op")
  ) {
    modulo = {
      modulo: "Ordenpago",
    };
  } else if (moduloUrl === "pagoservicios" || moduloUrl === "egresocuentaservicios") {
    modulo = {
      modulo: "Pagoservicios",
    };
  } else if (moduloUrl === "cuentacorrientecliente") {
    modulo = {
      modulo: "Cuentacorriente",
    };
  }

  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  services.decodeToken(token, tokenDecodificado => {
    let usuario = getValue(tokenDecodificado.id);

    usuario = JSON.parse(usuario);
    models.documento_serie
      .findAll({
        attributes: [
          "oficina_codigo",
          "documento_codigo",
          "documento_serie",
          "fecha_activacion",
          "estado_registro",
          "formato",
          "modulo",
        ],
        include: [
          {
            model: models.oficina,
            attributes: ["oficina_nombre"],
            where: {
              oficina_codigo: usuario.oficina_codigo,
            },
          },
          {
            model: models.documento,
            attributes: ["documento_descripcion"],
          },
        ],
        where: {
          estado_registro: true,
          ...modulo,
        },
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
  });
};

exports.listarRecibosIngreso = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  services.decodeToken(token, tokenDecodificado => {
    let usuario = getValue(tokenDecodificado.id);

    usuario = JSON.parse(usuario);
    models.documento_serie
      .findAll({
        attributes: [
          "oficina_codigo",
          "documento_codigo",
          "documento_serie",
          "fecha_activacion",
          "estado_registro",
          "formato",
        ],
        include: [
          {
            model: models.oficina,
            attributes: ["oficina_nombre"],
            where: {
              oficina_codigo: usuario.oficina_codigo,
            },
          },
          {
            model: models.documento,
            attributes: ["documento_descripcion"],
          },
        ],
        where: {
          estado_registro: true,
          modulo: "Reciboingreso",
        },
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
  });
};

exports.listarRecibosHabilitaciones = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  services.decodeToken(token, tokenDecodificado => {
    let usuario = getValue(tokenDecodificado.id);

    usuario = JSON.parse(usuario);
    models.documento_serie
      .findAll({
        attributes: [
          "oficina_codigo",
          "documento_codigo",
          "documento_serie",
          "fecha_activacion",
          "estado_registro",
          "formato",
        ],
        include: [
          {
            model: models.oficina,
            attributes: ["oficina_nombre"],
            where: {
              oficina_codigo: usuario.oficina_codigo,
            },
          },
          {
            model: models.documento,
            attributes: ["documento_descripcion"],
          },
        ],
        where: {
          estado_registro: true,
          modulo: "Habilitaciones",
        },
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
  });
};

exports.listarRecibosEgreso = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  services.decodeToken(token, tokenDecodificado => {
    let usuario = getValue(tokenDecodificado.id);

    usuario = JSON.parse(usuario);
    models.documento_serie
      .findAll({
        attributes: [
          "oficina_codigo",
          "documento_codigo",
          "documento_serie",
          "fecha_activacion",
          "estado_registro",
          "formato",
        ],
        include: [
          {
            model: models.oficina,
            attributes: ["oficina_nombre"],
            where: {
              oficina_codigo: usuario.oficina_codigo,
            },
          },
          {
            model: models.documento,
            attributes: ["documento_descripcion"],
          },
        ],
        where: {
          estado_registro: true,
          modulo: "Reciboegreso",
        },
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
  });
};

exports.listarDocumentoRI = (req, res) => {
  const moduloUrl = req.originalUrl.split("/")[3];
  let modulo = {};
  if (moduloUrl == "anular") {
    modulo = {
      modulo: "Reciboegreso",
    };
  } else if (moduloUrl == "extornar") {
    modulo = {
      modulo: "Reciboingreso",
    };
  }

  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  services.decodeToken(token, tokenDecodificado => {
    let usuario = getValue(tokenDecodificado.id);

    usuario = JSON.parse(usuario);
    models.documento_serie
      .findAll({
        attributes: [
          "oficina_codigo",
          "documento_codigo",
          "documento_serie",
          "fecha_activacion",
          "estado_registro",
          "formato",
        ],
        include: [
          {
            model: models.oficina,
            attributes: ["oficina_nombre"],
            where: {
              oficina_codigo: usuario.oficina_codigo,
            },
          },
          {
            model: models.documento,
            attributes: ["documento_descripcion"],
          },
        ],
        where: {
          estado_registro: true,
          ...modulo,
        },
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
  });
};

exports.listarTodosActivos = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  services.decodeToken(token, tokenDecodificado => {
    let usuario = getValue(tokenDecodificado.id);

    usuario = JSON.parse(usuario);
    models.documento_serie
      .findAll({
        attributes: [
          "oficina_codigo",
          "documento_codigo",
          "documento_serie",
          "fecha_activacion",
          "estado_registro",
          "modulo",
        ],
        include: [
          {
            model: models.documento,
            attributes: ["documento_descripcion"],
          },
        ],
        where: {
          estado_registro: true,
          oficina_codigo: usuario.oficina_codigo,
        },
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
  });
};

exports.listarDocumentosOficinas = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.documento_serie
    .findAll({
      attributes: [
        "oficina_codigo",
        "documento_codigo",
        "documento_serie",
        "fecha_activacion",
        "estado_registro",
        "modulo",
        "createdAt",
      ],
      include: [
        {
          model: models.oficina,
          attributes: ["oficina_nombre"],
        },
        {
          model: models.documento,
          attributes: ["documento_descripcion"],
        },
      ],
      order: [[models.oficina, "oficina_nombre", "ASC"]],
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

exports.listarPor = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.documento_serie
    .findAll({
      where: {
        oficina_codigo: req.params.oficina_codigo || req.query.oficina_codigo,
      },
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
  models.documento_serie
    .destroy({
      where: {
        documento_codigo: req.params.documento_codigo,
        documento_serie: req.params.documento_serie,
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
      res.status(409).send();
    });
};
