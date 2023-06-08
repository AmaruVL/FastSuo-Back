const Sequelize = require("sequelize");
const models = require("../models");
const moment = require("moment");
const axios = require("axios");
const Op = Sequelize.Op;
const fs = require("fs");
const utils = require("../services/utils");
var filename = module.filename.split("/").slice(-1);

exports.migrar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  let rawdata = fs.readFileSync("personas.json");
  let jsonPersonas = JSON.parse(rawdata);
  let arrcreate = [];
  jsonPersonas.personas.forEach(persona => {
    arrcreate.push({
      id_cliente: persona.dni,
      cliente_tipo_persona: "Natural",
      nombres: persona.nombre,
      ap_paterno: persona.apPaterno,
      ap_materno: persona.apMaterno,
      razon_social: `${persona.nombre} ${persona.apPaterno} ${persona.apMaterno}`
    });
  });
  models.cliente_proveedor
    .bulkCreate(arrcreate, {
      ignoreDuplicates: true
    })
    .then(result => {
      res.status(200).send(result);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(409).send("Error");
    });
};

exports.crear = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.cliente_proveedor
    .create({
      id_cliente: req.body.id_cliente,
      cliente_tipo_persona: req.body.cliente_tipo_persona,
      nombres: req.body.nombres,
      ap_paterno: req.body.ap_paterno,
      ap_materno: req.body.ap_materno,
      razon_social: req.body.razon_social,
      sexo: req.body.sexo,
      fecha_nacimiento: req.body.fecha_nacimiento,
      nro_fijo: req.body.nro_fijo,
      nro_movil: req.body.nro_movil,
      correo: req.body.correo,
      direccion: req.body.direccion
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
  models.cliente_proveedor
    .findByPk(req.params.id_administrado, {
      attributes: ["id_cliente", "nombres", "ap_paterno", "ap_materno", "razon_social", "fecha_nacimiento", "sexo"]
    })
    .then(objeto => {
      //si existe en la base de datos retornar resultado
      if (objeto) {
        res.json(objeto);
      }
      //caso contrario crear nuevo cliente y retornar resultado
      else {
        if (req.params.id_administrado.length === 11 && (req.params.id_administrado.substring(0, 2) == "20" || req.params.id_administrado.substring(0, 2) == "10")) {
          //buscando en JNE
          utils.buscarRUC(req.params.id_administrado, respuesta => {
            if (respuesta) {
              models.cliente_proveedor
                .create({
                  id_cliente: req.params.id_administrado,
                  ap_paterno: "",
                  ap_materno: "",
                  nombres: "",
                  cliente_tipo_persona: "Juridica",
                  direccion: respuesta.domicilio_fiscal,
                  razon_social: respuesta.razon_social
                })
                .then(objeto => {
                  res.json(objeto);
                })
                .catch(err => {
                  logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
                  res.status(400).json({
                    error: "Error al guardar cliente"
                  });
                  console.log(err)
                });
            } else {
              logger.log("warn", { ubicacion: filename, token: token, message: "RUC no encontrado" });
              res.status(400).json({
                error: "RUC no encontrado"
              });
            }
          });
        } else {
          utils.buscarDNI(req.params.id_administrado, respuesta => {
            if (respuesta) {
              models.cliente_proveedor
                .create({
                  id_cliente: respuesta.dni,
                  cliente_tipo_persona: "Natural",
                  ap_paterno: respuesta.ap_paterno,
                  ap_materno: respuesta.ap_materno,
                  nombres: respuesta.nombres,
                  razon_social: `${respuesta.nombres} ${respuesta.ap_paterno} ${respuesta.ap_materno}`,
                  fecha_nacimiento: null,// moment(respuesta.fecha_nacimiento, "DD/MM/YYYY").format("YYYY-MM-DD"),
                  sexo: respuesta.sexo,
                  direccion: respuesta.direccion
                })
                .then(objeto => {
                  res.json(objeto);
                });
            } else {
              logger.log("warn", { ubicacion: filename, token: token, message: "No se encontro DNI" });
              res.status(409).send("No se encontro DNI");
            }
          });
        }
      }
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.json({
        error: err.errors
      });
      console.log(err)
    });
};

exports.buscarNombre = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.cliente_proveedor
    .findAll({
      where: {
        [Op.or]: [
          {
            razon_social: {
              [Op.iLike]: `%${req.params.nombre}%`
            }
          },
          {
            id_cliente: req.params.nombre
          }
        ]
      },
      limit: 20,
      attributes: [
        "id_cliente",
        "nombres",
        "ap_paterno",
        "ap_materno",
        "razon_social",
        "cliente_tipo_persona",
        "sexo",
        "fecha_nacimiento",
        "nro_fijo",
        "nro_movil",
        "correo",
        "direccion",
        "createdAt",
        [Sequelize.fn("CONCAT", Sequelize.col("nombres"), " ", Sequelize.col("ap_paterno"), " ", Sequelize.col("ap_materno")), "full_name"]
      ],
      order: [["razon_social", "ASC"]]
    })
    .then(respuesta => {
      res.json(respuesta);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(409).send(err);
    });
};

exports.buscarRazonSocial = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.cliente_proveedor
    .findOne({
      where: {
        razon_social: req.params.razon_social
      }
    })
    .then(objeto => {
      //si existe en la base de datos retornar resultado
      if (objeto) {
        res.json(objeto);
      }
      //caso contrario crear nuevo cliente y retornar resultado
      else {
        //buscando en JNE
        axios({
          method: "get",
          baseURL: "http://aplicaciones007.jne.gob.pe/srop_publico/Consulta/Afiliado/GetNombresCiudadano",
          url: `?DNI=${req.params.razon_social}`
        }).then(response => {
          let datos = response.data.split("|");
          if (datos.length > 0) {
            //si la respuesta tiene separadores |
            if (datos[0].length > 0) {
              //si existe se crea un nuevo cliente en BD
              models.cliente_proveedor
                .create({
                  id_cliente: req.params.razon_social,
                  cliente_tipo_persona: "NATURAL",
                  ap_paterno: datos[0],
                  ap_materno: datos[1],
                  nombres: datos[2],
                  razon_social: req.params.razon_social
                })
                .then(objeto => {
                  res.json(objeto);
                });
            } else {
              logger.log("warn", { ubicacion: filename, token: token, message: "DNI no encontrado" });
              res.status(400).json({
                error: "DNI no encontrado"
              });
            }
          } else {
            logger.log("warn", { ubicacion: filename, token: token, message: "DNI no encontrado" });
            res.status(400).json({
              error: "DNI no encontrado"
            });
          }
        });
      }
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
  let fecha_nacimiento = {};
  fecha_nacimiento = req.body.fecha_nacimiento
    ? {
        fecha_nacimiento: req.body.fecha_nacimiento.split("T")[0]
      }
    : {};
  models.cliente_proveedor
    .update(
      {
        cliente_tipo_persona: req.body.cliente_tipo_persona,
        nombres: req.body.nombres,
        ap_paterno: req.body.ap_paterno,
        ap_materno: req.body.ap_materno,
        razon_social: req.body.razon_social,
        sexo: req.body.sexo,
        ...fecha_nacimiento,
        nro_fijo: req.body.nro_fijo,
        nro_movil: req.body.nro_movil,
        correo: req.body.correo,
        direccion: req.body.direccion
      },
      {
        where: {
          id_cliente: req.params.id_administrado
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

//TODO: Agregar paginación a endpoint listar
exports.listar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.cliente_proveedor
    .findAll({
      limit: 20,
      attributes: [
        "id_cliente",
        "nombres",
        "ap_paterno",
        "ap_materno",
        "razon_social",
        "cliente_tipo_persona",
        "sexo",
        "fecha_nacimiento",
        "nro_fijo",
        "nro_movil",
        "correo",
        "direccion",
        "createdAt",
        [Sequelize.fn("CONCAT", Sequelize.col("nombres"), " ", Sequelize.col("ap_paterno"), " ", Sequelize.col("ap_materno")), "full_name"]
      ],
      order: [["razon_social", "ASC"]]
    })
    .then(lista => {
      res.json(lista);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send(err);
    });
};

exports.listarMin = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.cliente_proveedor
    .findAll({
      attributes: ["id_cliente", "nombres", "ap_paterno", "ap_materno", "nro_movil", ["razon_social", "full_name"], "fecha_nacimiento", "sexo"]
    })
    .then(lista => {
      res.json(lista);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(412).send(err);
    });
};

exports.eliminar = (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  models.cliente_proveedor
    .destroy({
      where: {
        id_cliente: req.params.id_administrado
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
