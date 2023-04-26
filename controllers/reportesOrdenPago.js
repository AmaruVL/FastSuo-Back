const Sequelize = require("sequelize");
var PdfPrinter = require("pdfmake");
const Excel = require("exceljs");
const utils = require("../services/utils")
const models = require("../models");
const moment = require("moment");
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.listaOrdenesPago = async (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  const oficinaDestino = req.params.oficina;
  const fechai = req.params.fechai;
  const fechaf = req.params.fechaf;
  let oficina_nombre = "TODAS";
  if (oficinaDestino != "*") {
    const oficina = await models.oficina.findOne({
      where: {
        oficina_codigo: oficinaDestino
      }
    });
    oficina_nombre = oficina.oficina_nombre;
  }

  models.sequelize
    .query(`SELECT * from ordenes_pago_oficina('${oficinaDestino}', '${fechai}', '${fechaf}')`, {
      type: models.sequelize.QueryTypes.SELECT
    })
    .then(lista => {
      var ops = lista.map(function(item) {
        let arrValores = Object.values(item);
        arrValores[0] = {
          text: arrValores[0],
          noWrap: true,
          alignment: "right"
        };
        arrValores[1] = {
          text: arrValores[1],
          noWrap: true,
          fillColor:
            arrValores[10] === "PAGADA"
              ? "#c0ffbd"
              : arrValores[10] === "PENDIENTE"
              ? "#fff9bd"
              : arrValores[10] === "ANULADA"
              ? "#ffbdbd"
              : arrValores[10] === "EXTORNADA"
              ? "#e096ff"
              : null
        };
        arrValores[2] = {
          text: arrValores[2],
          noWrap: true,
          alignment: "right"
        };
        arrValores[3] = {
          text: arrValores[3],
          noWrap: false
        };
        arrValores[4] = {
          text: arrValores[4],
          noWrap: false
        };
        arrValores[6] = {
          text: arrValores[6],
          noWrap: true,
          alignment: "right"
        };
        arrValores[7] = {
          text: arrValores[7],
          noWrap: true,
          alignment: "right"
        };
        arrValores[8] = {
          text: arrValores[8],
          noWrap: true,
          alignment: "right"
        };
        arrValores[9] = {
          text: arrValores[9],
          noWrap: true,
          alignment: "right"
        };
        arrValores.pop();
        return arrValores;
      });

      var fonts = {
        Helvetica: {
          normal: "Helvetica",
          bold: "Helvetica-Bold",
          italics: "Helvetica-Oblique",
          bolditalics: "Helvetica-BoldOblique"
        }
      };

      var docDefinition = {
        defaultStyle: {
          font: "Helvetica"
        },
        header: function(currentPage, pageCount, pageSize) {
          // you can apply any logic and return any valid pdfmake element
          return [
            {
              text: [`Pág. ${currentPage}/${pageCount}`],
              style: "header",
              alignment: currentPage % 2 ? "right" : "left"
            },
            {
              text: [
                moment()
                  .locale("es")
                  .format("LLLL")
              ],
              style: "header",
              alignment: currentPage % 2 ? "right" : "left",
              margin: [20, 0, 20, 0]
            },
            {
              canvas: [
                {
                  type: "rect",
                  x: 170,
                  y: 32,
                  w: pageSize.width - 170,
                  h: 40
                }
              ]
            }
          ];
        },
        //pageMArgins:[Left, Top, Right, Bottom]
        pageMargins: [10, 30, 10, 40],
        content: [
          {
            text: "Listado de giros recaudados",
            style: "titulo"
          },
          {
            text: [
              {
                text: oficina_nombre,
                style: "oficina"
              },
              {
                text: ` Del ${fechai} Al ${fechaf}`,
                style: "rangoFecha"
              }
            ]
          },
          {
            style: "leyenda",
            table: {
              // headers are automatically repeated if the table spans over multiple pages
              // you can declare how many rows should be treated as headers
              headerRows: 1,
              // ANCHO DE  CADA COLUMNA
              widths: ["auto", "auto", "auto", "auto", "auto"],
              body: [
                [
                  "LEYENDA",
                  {
                    text: "PENDIENTE",
                    color: "#f7e100"
                  },
                  {
                    text: "PAGADO",
                    color: "#0cff00"
                  },
                  {
                    text: "ANULADO",
                    color: "#ff0000"
                  },
                  {
                    text: "EXTORNADO",
                    color: "#b300ff"
                  }
                ]
              ]
            }
          },
          {
            style: "tabla",
            table: {
              // headers are automatically repeated if the table spans over multiple pages
              // you can declare how many rows should be treated as headers
              headerRows: 2,
              // ANCHO DE  CADA COLUMNA
              widths: ["auto", "auto", "auto", "*", "*", "auto", "auto", "auto", "auto", "auto"],
              body: [
                [
                  "",
                  "",
                  "",
                  "",
                  "",
                  "",
                  {
                    text: "Soles",
                    colSpan: 2,
                    alignment: "center"
                  },
                  {},
                  {
                    text: "Dolares",
                    colSpan: 2,
                    alignment: "center"
                  },
                  {}
                ],
                ["Nro", "Base", "Nro Op", "Beneficiario", "Solicitante", "Fecha", "Importe", "DT", "Importe", "Banco"],
                ...ops
              ]
            },
            layout: {
              hLineWidth: function(i, node) {
                return i === 2 || i === node.table.body.length ? 1 : 0;
              },
              vLineWidth: function(i, node) {
                return 0;
              },
              hLineColor: function(i, node) {
                return i === 0 || i === node.table.body.length ? "black" : "gray";
              },
              // vLineColor: function (i, node) {return (i === 0 || i === node.table.widths.length) ? 'black' : 'gray';},
              // hLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
              // vLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
              paddingLeft: function(i, node) {
                return 4;
              },
              paddingRight: function(i, node) {
                return 0;
              },
              // paddingTop: function(i, node) { return 2; },
              // paddingBottom: function(i, node) { return 2; },
              // fillColor: function (rowIndex, node, columnIndex) { return null; }
              fillColor: function(rowIndex, node, columnIndex) {
                return rowIndex > 2 && rowIndex % 2 === 1 ? "#e6e6e6" : null;
              }
            }
          }
        ],
        styles: {
          header: {
            fontSize: 10,
            margin: [20, 10, 20, 0]
          },
          leyenda: {
            fontSize: 8,
            margin: [10, 10, 0, 0]
          },
          tabla: {
            margin: [10, 0, 10, 0],
            fontSize: 7
          },
          titulo: {
            fontSize: 18,
            bold: true,
            alignment: "center",
            margin: [0, 10, 0, 4]
          },
          oficina: {
            fontSize: 10,
            bold: true,
            alignment: "center",
            margin: [0, 0, 0, 10]
          },
          rangoFecha: {
            fontSize: 9,
            bold: false,
            alignment: "center",
            margin: [0, 0, 0, 10]
          }
        }
      };
      var printer = new PdfPrinter(fonts);
      var now = new Date();
      var pdfDoc = printer.createPdfKitDocument(docDefinition);
      var chunks = [];
      var result;

      pdfDoc.on("data", function(chunk) {
        chunks.push(chunk);
      });
      pdfDoc.on("end", function() {
        result = Buffer.concat(chunks);
        res.contentType("application/pdf");
        res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
        res.setHeader("Content-Disposition", `attachment; filename=${oficina_nombre}.pdf`);
        res.send(result);
      });
      pdfDoc.end();
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(409).send("Error al generar");
    });
};

exports.recibidos = async (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      const caja_codigo = req.body.caja_codigo ? req.body.caja_codigo : usuario.caja_codigo;
      const opcion = req.body.opcion;
      const estado = req.body.estado;
      const beneficiario = req.body.nombre_beneficiario;
      const solicitante = req.body.nombre_solicitante;
      const fechai = req.body.fechai;
      const fechaf = req.body.fechaf;
      models.sequelize
        .query(`SELECT * from giros_recibidos_caja1('${caja_codigo}','${opcion}','${estado}','${beneficiario}','${solicitante}', '${fechai}', '${fechaf}')`, {
          type: models.sequelize.QueryTypes.SELECT
        })
        .then(resp => {
          res.json(resp);
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
          res.status(409).send("Error al generar");
        });
    });
  });
};

exports.recibidos_oficina = async (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  const oficinaDestino = req.params.oficina;
  const opcion = req.params.opcion;
  const estado = req.params.estado;
  const beneficiario = req.params.nombre_beneficiario;
  const solicitante = req.params.nombre_solicitante;
  const fechai = req.params.fechai;
  const fechaf = req.params.fechaf;

  models.sequelize
    .query(`SELECT * from giros_recibidos_oficina('${oficinaDestino}','${opcion}','${estado}','${beneficiario}','${solicitante}', '${fechai}', '${fechaf}')`, {
      type: models.sequelize.QueryTypes.SELECT
    })
    .then(resp => {
      res.json(resp);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(409).send("Error al generar");
    });
};

exports.recibidos_empresa = async (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  const empresaDestino = req.params.empresa;
  const opcion = req.params.opcion;
  const estado = req.params.estado;
  const beneficiario = req.params.nombre_beneficiario;
  const solicitante = req.params.nombre_solicitante;
  const fechai = req.params.fechai;
  const fechaf = req.params.fechaf;

  models.sequelize
    .query(`SELECT * from giros_recibidos_empresa1('${empresaDestino}','${opcion}','${estado}','${beneficiario}','${solicitante}', '${fechai}', '${fechaf}')`, {
      type: models.sequelize.QueryTypes.SELECT
    })
    .then(resp => {
      res.json(resp);
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(409).send("Error al generar");
    });
};

exports.listarecibidos = async (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, async (err, usuario) => {
      usuario = JSON.parse(usuario);
      const caja_codigo = req.body.caja_codigo ? req.body.caja_codigo : usuario.caja_codigo;
      const opcion = req.body.opcion;
      const estado = req.body.estado;
      const beneficiario = req.body.nombre_beneficiario;
      const solicitante = req.body.nombre_solicitante;
      const fechai = req.body.fechai;
      const fechaf = req.body.fechaf;
      let caja_nombre = "";
      let nombre = "";

      const caja = await models.caja.findOne({
        where: {
          caja_codigo: caja_codigo
        }
      });
      nombre = caja.caja_nombre;
      caja_nombre = caja.caja_nombre.replace(/ /g, "_");

      models.sequelize
        .query(`SELECT * from giros_recibidos_caja1('${caja_codigo}','${opcion}','${estado}','${beneficiario}','${solicitante}', '${fechai}', '${fechaf}')`, {
          type: models.sequelize.QueryTypes.SELECT
        })
        .then(lista => {
          var sumS = 0.0;
          var sumDT = 0.0;
          var sumBan = 0.0;
          var sumD = 0.0;
          var ops = lista.map(function(item) {
            let arrValores = Object.values(item);
            arrValores[0] = {
              text: arrValores[0],
              noWrap: true,
              alignment: "right"
            };
            arrValores[1] = {
              text: arrValores[1],
              noWrap: true,
              fillColor:
                arrValores[11] === 2
                  ? "#c0ffbd"
                  : arrValores[11] === 1
                  ? "#fff9bd"
                  : arrValores[11] === 3
                  ? "#a9a9a9"
                  : arrValores[11] === 4
                  ? "#ffbdbd"
                  : null
            };
            arrValores[2] = {
              text: arrValores[2],
              noWrap: true,
              alignment: "right"
            };
            arrValores[3] = {
              text: arrValores[3],
              noWrap: false
            };
            arrValores[4] = {
              text: arrValores[4],
              noWrap: false
            };
            arrValores[5] = {
              text: moment(arrValores[5]).format("DD/MM/Y"),
              noWrap: false
            };
            arrValores[6] = {
              text: arrValores[6] === null ? "" : moment(arrValores[6]).format("DD/MM/Y"),
              noWrap: false
            };
            arrValores[7] = {
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[7]),
              noWrap: true,
              alignment: "right"
            };
            arrValores[8] = {
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[8]),
              noWrap: true,
              alignment: "right"
            };
            arrValores[9] = {
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[10]),
              noWrap: true,
              alignment: "right"
            };
            arrValores.splice(10);
            return arrValores;
          });
          for (var i = 0; i < lista.length; i++) {
            sumS = sumS + parseFloat(lista[i].importe_soles);
            sumDT = sumDT + parseFloat(lista[i].comision_dt);
            //sumD = sumD + parseFloat(lista[i].importe_dolares);
            sumBan = sumBan + parseFloat(lista[i].comision_banco);
          }

          var fonts = {
            Helvetica: {
              normal: "Helvetica",
              bold: "Helvetica-Bold",
              italics: "Helvetica-Oblique",
              bolditalics: "Helvetica-BoldOblique"
            }
          };

          var docDefinition = {
            defaultStyle: {
              font: "Helvetica"
            },
            header: function(currentPage, pageCount, pageSize) {
              // you can apply any logic and return any valid pdfmake element
              return [
                {
                  text: [`Pág. ${currentPage}/${pageCount}`],
                  style: "header",
                  alignment: currentPage % 2 ? "right" : "left"
                },
                {
                  text: [
                    moment()
                      .locale("es")
                      .format("LLLL")
                  ],
                  style: "header",
                  alignment: currentPage % 2 ? "right" : "left",
                  margin: [20, 0, 20, 0]
                },
                {
                  canvas: [
                    {
                      type: "rect",
                      x: 170,
                      y: 32,
                      w: pageSize.width - 170,
                      h: 40
                    }
                  ]
                }
              ];
            },
            //pageMArgins:[Left, Top, Right, Bottom]
            pageMargins: [10, 30, 10, 40],
            content: [
              {
                text: "Listado de giros recibidos",
                style: "titulo"
              },
              {
                text: nombre,
                style: "oficina"
              },
              {
                text: ` Del ${fechai} Al ${fechaf}`,
                style: "rangoFecha"
              },
              {
                style: "leyenda",
                table: {
                  // headers are automatically repeated if the table spans over multiple pages
                  // you can declare how many rows should be treated as headers
                  headerRows: 1,
                  // ANCHO DE  CADA COLUMNA
                  widths: ["auto", "auto", "auto", "auto", "auto"],
                  body: [
                    [
                      "LEYENDA",
                      {
                        text: "PENDIENTE",
                        color: "#f7e100"
                      },
                      {
                        text: "PAGADO",
                        color: "#0cff00"
                      },
                      {
                        text: "REEMBOLSO",
                        color: "#a9a9a9"
                      },
                      {
                        text: "ANULADO",
                        color: "#ff0000"
                      } /*,
                      {
                        text: "EXTORNADO",
                        color: "#b300ff"
                      }*/
                    ]
                  ]
                }
              },
              {
                style: "tabla",
                table: {
                  // headers are automatically repeated if the table spans over multiple pages
                  // you can declare how many rows should be treated as headers
                  headerRows: 2,
                  // ANCHO DE  CADA COLUMNA
                  widths: ["auto", "auto", "auto", "*", "*", "auto", "auto", "auto", "auto", "auto"],
                  body: [
                    [
                      "",
                      "",
                      "",
                      "",
                      "",
                      "",
                      "",
                      {
                        text: "Soles",
                        colSpan: 2,
                        alignment: "center"
                      },
                      {},
                      {}
                    ],
                    ["Nro", "Base", "Nro Op", "Beneficiario", "Solicitante", "Fecha Solicitud", "Fecha Pagado", "Importe", "DT", "Banco"],
                    ...ops,
                    [
                      "",
                      "",
                      "",
                      "",
                      "",
                      "",
                      "TOTAL",
                      { text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(sumS)}`, noWrap: true, alignment: "right" },
                      { text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(sumDT)}`, noWrap: true, alignment: "right" },
                      { text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(sumBan)}`, noWrap: true, alignment: "right" }
                    ]
                  ]
                },
                layout: {
                  hLineWidth: function(i, node) {
                    return i === 2 || i === node.table.body.length - 1 ? 1 : 0;
                  },
                  vLineWidth: function(i, node) {
                    return 0;
                  },
                  hLineColor: function(i, node) {
                    return i === 0 || i === node.table.body.length - 1 ? "black" : "gray";
                  },
                  // vLineColor: function (i, node) {return (i === 0 || i === node.table.widths.length) ? 'black' : 'gray';},
                  // hLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
                  // vLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
                  paddingLeft: function(i, node) {
                    return 4;
                  },
                  paddingRight: function(i, node) {
                    return 0;
                  },
                  // paddingTop: function(i, node) { return 2; },
                  // paddingBottom: function(i, node) { return 2; },
                  // fillColor: function (rowIndex, node, columnIndex) { return null; }
                  fillColor: function(rowIndex, node, columnIndex) {
                    return rowIndex > 2 && rowIndex % 2 === 1 ? "#e6e6e6" : null;
                  }
                }
              }
            ],
            styles: {
              header: {
                fontSize: 10,
                margin: [20, 10, 20, 0]
              },
              leyenda: {
                fontSize: 8,
                margin: [10, 10, 0, 0]
              },
              tabla: {
                margin: [10, 0, 10, 0],
                fontSize: 7
              },
              titulo: {
                fontSize: 18,
                bold: true,
                alignment: "center",
                margin: [0, 10, 0, 4]
              },
              oficina: {
                fontSize: 10,
                bold: true,
                alignment: "center",
                margin: [0, 0, 0, 10]
              },
              rangoFecha: {
                fontSize: 9,
                bold: false,
                alignment: "center",
                margin: [0, 0, 0, 10]
              }
            }
          };
          var printer = new PdfPrinter(fonts);
          var now = new Date();
          var pdfDoc = printer.createPdfKitDocument(docDefinition);
          var chunks = [];
          var result;

          pdfDoc.on("data", function(chunk) {
            chunks.push(chunk);
          });
          pdfDoc.on("end", function() {
            result = Buffer.concat(chunks);
            res.contentType("application/pdf");
            res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
            res.setHeader(
              "Content-Disposition",
              `attachment; filename=GirosRecibidos_${caja_codigo}_${moment()
                .locale("es")
                .format("DD-MM-YYYY_HH'mm")}.pdf`
            );
            res.send(result);
          });
          pdfDoc.end();
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
          res.status(409).send("Error al generar");
        });
    });
  });
};

exports.listarecibidosOf = async (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  const oficinaDestino = req.params.oficina;
  const opcion = req.params.opcion;
  const estado = req.params.estado;
  const beneficiario = req.params.nombre_beneficiario;
  const solicitante = req.params.nombre_solicitante;
  const fechai = req.params.fechai;
  const fechaf = req.params.fechaf;
  let oficina_nombre = "TODAS";
  if (oficinaDestino != "*") {
    const oficina = await models.oficina.findOne({
      where: {
        oficina_codigo: oficinaDestino
      }
    });
    oficina_nombre = oficina.oficina_nombre.replace(/ /g, "_");
  }

  models.sequelize
    .query(`SELECT * from giros_recibidos_oficina('${oficinaDestino}','${opcion}','${estado}','${beneficiario}','${solicitante}', '${fechai}', '${fechaf}')`, {
      type: models.sequelize.QueryTypes.SELECT
    })
    .then(lista => {
      var sumS = 0.0;
      var sumDT = 0.0;
      var sumBan = 0.0;
      var sumD = 0.0;
      var ops = lista.map(function(item) {
        let arrValores = Object.values(item);
        arrValores[0] = {
          text: arrValores[0],
          noWrap: true,
          alignment: "right"
        };
        arrValores[1] = {
          text: arrValores[1],
          noWrap: true,
          fillColor:
            arrValores[12] === 2
              ? "#c0ffbd"
              : arrValores[12] === 1
              ? "#fff9bd"
              : arrValores[12] === 3
              ? "#a9a9a9"
              : arrValores[12] === 4
              ? "#ffbdbd"
              : null
        };
        arrValores[2] = {
          text: arrValores[2],
          noWrap: true
        };
        arrValores[3] = {
          text: arrValores[3],
          noWrap: true,
          alignment: "right"
        };
        arrValores[4] = {
          text: arrValores[4],
          noWrap: false
        };
        arrValores[5] = {
          text: arrValores[5],
          noWrap: false
        };
        arrValores[6] = {
          text: moment(arrValores[6]).format("DD/MM/Y"),
          noWrap: false
        };
        arrValores[7] = {
          text: arrValores[7] === null ? "" : moment(arrValores[6]).format("DD/MM/Y"),
          noWrap: false
        };
        arrValores[8] = {
          text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[8]),
          noWrap: true,
          alignment: "right"
        };
        arrValores[9] = {
          text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[9]),
          noWrap: true,
          alignment: "right"
        };
        arrValores[10] = {
          text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[11]),
          noWrap: true,
          alignment: "right"
        };
        arrValores.splice(11);
        return arrValores;
      });
      for (var i = 0; i < lista.length; i++) {
        sumS = sumS + parseFloat(lista[i].importe_soles);
        sumDT = sumDT + parseFloat(lista[i].comision_dt);
        //sumD = sumD + parseFloat(lista[i].importe_dolares);
        sumBan = sumBan + parseFloat(lista[i].comision_banco);
      }

      var fonts = {
        Helvetica: {
          normal: "Helvetica",
          bold: "Helvetica-Bold",
          italics: "Helvetica-Oblique",
          bolditalics: "Helvetica-BoldOblique"
        }
      };

      var docDefinition = {
        defaultStyle: {
          font: "Helvetica"
        },
        header: function(currentPage, pageCount, pageSize) {
          // you can apply any logic and return any valid pdfmake element
          return [
            {
              text: [`Pág. ${currentPage}/${pageCount}`],
              style: "header",
              alignment: currentPage % 2 ? "right" : "left"
            },
            {
              text: [
                moment()
                  .locale("es")
                  .format("LLLL")
              ],
              style: "header",
              alignment: currentPage % 2 ? "right" : "left",
              margin: [20, 0, 20, 0]
            },
            {
              canvas: [
                {
                  type: "rect",
                  x: 170,
                  y: 32,
                  w: pageSize.width - 170,
                  h: 40
                }
              ]
            }
          ];
        },
        //pageMArgins:[Left, Top, Right, Bottom]
        pageMargins: [10, 30, 10, 40],
        content: [
          {
            text: "Listado de giros recibidos",
            style: "titulo"
          },
          {
            text: oficina_nombre,
            style: "oficina"
          },
          {
            text: ` Del ${fechai} Al ${fechaf}`,
            style: "rangoFecha"
          },
          {
            style: "leyenda",
            table: {
              // headers are automatically repeated if the table spans over multiple pages
              // you can declare how many rows should be treated as headers
              headerRows: 1,
              // ANCHO DE  CADA COLUMNA
              widths: ["auto", "auto", "auto", "auto", "auto"],
              body: [
                [
                  "LEYENDA",
                  {
                    text: "PENDIENTE",
                    color: "#f7e100"
                  },
                  {
                    text: "PAGADO",
                    color: "#0cff00"
                  },
                  {
                    text: "REEMBOLSO",
                    color: "#a9a9a9"
                  },
                  {
                    text: "ANULADO",
                    color: "#ff0000"
                  } /*,
                  {
                    text: "EXTORNADO",
                    color: "#b300ff"
                  }*/
                ]
              ]
            }
          },
          {
            style: "tabla",
            table: {
              // headers are automatically repeated if the table spans over multiple pages
              // you can declare how many rows should be treated as headers
              headerRows: 2,
              // ANCHO DE  CADA COLUMNA
              widths: ["auto", "auto", "auto", "auto", "*", "*", "auto", "auto", "auto", "auto", "auto"],
              body: [
                [
                  "",
                  "",
                  "",
                  "",
                  "",
                  "",
                  "",
                  "",
                  {
                    text: "Soles",
                    colSpan: 2,
                    alignment: "center"
                  },
                  {},
                  {}
                ],
                [
                  "Nro",
                  "Origen",
                  "Destino",
                  "Nro Op",
                  "Beneficiario",
                  "Solicitante",
                  "Fecha Solicitud",
                  "Fecha Pagado",
                  "Importe",
                  "DT",
                  "Banco"
                ],
                ...ops,
                [
                  "",
                  "",
                  "",
                  "",
                  "",
                  "",
                  "",
                  "TOTAL",
                  { text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(sumS)}`, noWrap: true, alignment: "right" },
                  { text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(sumDT)}`, noWrap: true, alignment: "right" },
                  { text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(sumBan)}`, noWrap: true, alignment: "right" }
                ]
              ]
            },
            layout: {
              hLineWidth: function(i, node) {
                return i === 2 || i === node.table.body.length - 1 ? 1 : 0;
              },
              vLineWidth: function(i, node) {
                return 0;
              },
              hLineColor: function(i, node) {
                return i === 0 || i === node.table.body.length - 1 ? "black" : "gray";
              },
              // vLineColor: function (i, node) {return (i === 0 || i === node.table.widths.length) ? 'black' : 'gray';},
              // hLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
              // vLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
              paddingLeft: function(i, node) {
                return 4;
              },
              paddingRight: function(i, node) {
                return 0;
              },
              // paddingTop: function(i, node) { return 2; },
              // paddingBottom: function(i, node) { return 2; },
              // fillColor: function (rowIndex, node, columnIndex) { return null; }
              fillColor: function(rowIndex, node, columnIndex) {
                return rowIndex > 2 && rowIndex % 2 === 1 ? "#e6e6e6" : null;
              }
            }
          }
        ],
        styles: {
          header: {
            fontSize: 10,
            margin: [20, 10, 20, 0]
          },
          leyenda: {
            fontSize: 8,
            margin: [10, 10, 0, 0]
          },
          tabla: {
            margin: [10, 0, 10, 0],
            fontSize: 7
          },
          titulo: {
            fontSize: 18,
            bold: true,
            alignment: "center",
            margin: [0, 10, 0, 4]
          },
          oficina: {
            fontSize: 10,
            bold: true,
            alignment: "center",
            margin: [0, 0, 0, 10]
          },
          rangoFecha: {
            fontSize: 9,
            bold: false,
            alignment: "center",
            margin: [0, 0, 0, 10]
          }
        }
      };
      var printer = new PdfPrinter(fonts);
      var now = new Date();
      var pdfDoc = printer.createPdfKitDocument(docDefinition);
      var chunks = [];
      var result;

      pdfDoc.on("data", function(chunk) {
        chunks.push(chunk);
      });
      pdfDoc.on("end", function() {
        result = Buffer.concat(chunks);
        res.contentType("application/pdf");
        res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=GirosRecibidos_${oficinaDestino}_${moment()
            .locale("es")
            .format("DD-MM-YYYY_HH'mm")}.pdf`
        );
        res.send(result);
      });
      pdfDoc.end();
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(409).send("Error al generar");
      console.log(err);
    });
};

exports.listarecibidosEmp = async (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  const empresaDestino = req.params.empresa;
  const opcion = req.params.opcion;
  const estado = req.params.estado;
  const beneficiario = req.params.nombre_beneficiario;
  const solicitante = req.params.nombre_solicitante;
  const fechai = req.params.fechai;
  const fechaf = req.params.fechaf;
  let empresa_nombre = "TODAS";
  let empresaNombre = "";
  if (empresaDestino != "*") {
    const empresa = await models.empresa.findOne({
      where: {
        empresa_codigo: empresaDestino
      }
    });
    empresaNombre = empresa.razon_social;
    empresa_nombre = empresa.razon_social.replace(/ /g, "_");
  }

  models.sequelize
    .query(`SELECT * from giros_recibidos_empresa1('${empresaDestino}','${opcion}','${estado}','${beneficiario}','${solicitante}', '${fechai}', '${fechaf}')`, {
      type: models.sequelize.QueryTypes.SELECT
    })
    .then(lista => {
      var sumS = 0.0;
      var sumDT = 0.0;
      var sumBan = 0.0;
      var sumD = 0.0;
      var ops = lista.map(function(item) {
        let arrValores = Object.values(item);
        arrValores[0] = {
          text: arrValores[0],
          noWrap: true,
          alignment: "right"
        };
        arrValores[1] = {
          text: arrValores[1],
          noWrap: true,
          fillColor:
            arrValores[11] === 2
              ? "#c0ffbd"
              : arrValores[11] === 1
              ? "#fff9bd"
              : arrValores[11] === 3
              ? "#a9a9a9"
              : arrValores[11] === 4
              ? "#ffbdbd"
              : null
        };
        arrValores[2] = {
          text: arrValores[2],
          noWrap: true,
          alignment: "right"
        };
        arrValores[3] = {
          text: arrValores[3],
          noWrap: false
        };
        arrValores[4] = {
          text: arrValores[4],
          noWrap: false
        };
        arrValores[5] = {
          text: moment(arrValores[5]).format("DD/MM/Y"),
          noWrap: false
        };
        arrValores[6] = {
          text: arrValores[6] === null ? "" : moment(arrValores[6]).format("DD/MM/Y"),
          noWrap: false
        };
        arrValores[7] = {
          text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[7]),
          noWrap: true,
          alignment: "right"
        };
        arrValores[8] = {
          text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[8]),
          noWrap: true,
          alignment: "right"
        };
        arrValores[9] = {
          text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[10]),
          noWrap: true,
          alignment: "right"
        };
        arrValores.splice(10);
        return arrValores;
      });
      for (var i = 0; i < lista.length; i++) {
        sumS = sumS + parseFloat(lista[i].importe_soles);
        sumDT = sumDT + parseFloat(lista[i].comision_dt);
        //sumD = sumD + parseFloat(lista[i].importe_dolares);
        sumBan = sumBan + parseFloat(lista[i].comision_banco);
      }

      var fonts = {
        Helvetica: {
          normal: "Helvetica",
          bold: "Helvetica-Bold",
          italics: "Helvetica-Oblique",
          bolditalics: "Helvetica-BoldOblique"
        }
      };

      var docDefinition = {
        defaultStyle: {
          font: "Helvetica"
        },
        header: function(currentPage, pageCount, pageSize) {
          // you can apply any logic and return any valid pdfmake element
          return [
            {
              text: [`Pág. ${currentPage}/${pageCount}`],
              style: "header",
              alignment: currentPage % 2 ? "right" : "left"
            },
            {
              text: [
                moment()
                  .locale("es")
                  .format("LLLL")
              ],
              style: "header",
              alignment: currentPage % 2 ? "right" : "left",
              margin: [20, 0, 20, 0]
            },
            {
              canvas: [
                {
                  type: "rect",
                  x: 170,
                  y: 32,
                  w: pageSize.width - 170,
                  h: 40
                }
              ]
            }
          ];
        },
        //pageMArgins:[Left, Top, Right, Bottom]
        pageMargins: [10, 30, 10, 40],
        content: [
          {
            text: "Listado de giros recibidos",
            style: "titulo"
          },
          {
            text: empresaNombre,
            style: "oficina"
          },
          {
            text: ` Del ${fechai} Al ${fechaf}`,
            style: "rangoFecha"
          },
          {
            style: "leyenda",
            table: {
              // headers are automatically repeated if the table spans over multiple pages
              // you can declare how many rows should be treated as headers
              headerRows: 1,
              // ANCHO DE  CADA COLUMNA
              widths: ["auto", "auto", "auto", "auto", "auto"],
              body: [
                [
                  "LEYENDA",
                  {
                    text: "PENDIENTE",
                    color: "#f7e100"
                  },
                  {
                    text: "PAGADO",
                    color: "#0cff00"
                  },
                  {
                    text: "REEMBOLSO",
                    color: "#a9a9a9"
                  },
                  {
                    text: "ANULADO",
                    color: "#ff0000"
                  }
                ]
              ]
            }
          },
          {
            style: "tabla",
            table: {
              // headers are automatically repeated if the table spans over multiple pages
              // you can declare how many rows should be treated as headers
              headerRows: 2,
              // ANCHO DE  CADA COLUMNA
              widths: ["auto", "auto", "auto", "*", "*", "auto", "auto", "auto", "auto", "auto"],
              body: [
                [
                  "",
                  "",
                  "",
                  "",
                  "",
                  "",
                  "",
                  {
                    text: "Soles",
                    colSpan: 2,
                    alignment: "center"
                  },
                  {},
                  {}
                ],
                ["Nro", "Base", "Nro Op", "Beneficiario", "Solicitante", "Fecha Solicitud", "Fecha Pagado", "Importe", "DT", "Banco"],
                ...ops,
                [
                  "",
                  "",
                  "",
                  "",
                  "",
                  "",
                  "TOTAL",
                  { text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(sumS)}`, noWrap: true, alignment: "right" },
                  { text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(sumDT)}`, noWrap: true, alignment: "right" },
                  { text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(sumBan)}`, noWrap: true, alignment: "right" }
                ]
              ]
            },
            layout: {
              hLineWidth: function(i, node) {
                return i === 2 || i === node.table.body.length - 1 ? 1 : 0;
              },
              vLineWidth: function(i, node) {
                return 0;
              },
              hLineColor: function(i, node) {
                return i === 0 || i === node.table.body.length - 1 ? "black" : "gray";
              },
              // vLineColor: function (i, node) {return (i === 0 || i === node.table.widths.length) ? 'black' : 'gray';},
              // hLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
              // vLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
              paddingLeft: function(i, node) {
                return 4;
              },
              paddingRight: function(i, node) {
                return 0;
              },
              // paddingTop: function(i, node) { return 2; },
              // paddingBottom: function(i, node) { return 2; },
              // fillColor: function (rowIndex, node, columnIndex) { return null; }
              fillColor: function(rowIndex, node, columnIndex) {
                return rowIndex > 2 && rowIndex % 2 === 1 ? "#e6e6e6" : null;
              }
            }
          }
        ],
        styles: {
          header: {
            fontSize: 10,
            margin: [20, 10, 20, 0]
          },
          leyenda: {
            fontSize: 8,
            margin: [10, 10, 0, 0]
          },
          tabla: {
            margin: [10, 0, 10, 0],
            fontSize: 7
          },
          titulo: {
            fontSize: 18,
            bold: true,
            alignment: "center",
            margin: [0, 10, 0, 4]
          },
          oficina: {
            fontSize: 10,
            bold: true,
            alignment: "center",
            margin: [0, 0, 0, 10]
          },
          rangoFecha: {
            fontSize: 9,
            bold: false,
            alignment: "center",
            margin: [0, 0, 0, 10]
          }
        }
      };
      var printer = new PdfPrinter(fonts);
      var now = new Date();
      var pdfDoc = printer.createPdfKitDocument(docDefinition);
      var chunks = [];
      var result;

      pdfDoc.on("data", function(chunk) {
        chunks.push(chunk);
      });
      pdfDoc.on("end", function() {
        result = Buffer.concat(chunks);
        res.contentType("application/pdf");
        res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=GirosRecibidos_${empresaDestino}_${moment()
            .locale("es")
            .format("DD-MM-YYYY_HH'mm")}.pdf`
        );
        res.send(result);
      });
      pdfDoc.end();
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(409).send("Error al generar");
      console.log(err);
    });
};

//--------------
exports.excelcaja = async (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  const caja_codigo = req.body.caja_codigo ? req.body.caja_codigo : usuario.caja_codigo;
  const opcion = req.body.opcion;
  const estado = req.body.estado;
  const beneficiario = req.body.nombre_beneficiario;
  const solicitante = req.body.nombre_solicitante;
  const fechai = req.body.fechai;
  const fechaf = req.body.fechaf;
  let caja_nombre = "";
  let nombre = "";

  const caja = await models.caja.findOne({
    where: {
      caja_codigo: caja_codigo
    }
  });
  nombre = caja.caja_nombre;
  caja_nombre = caja.caja_nombre.replace(/ /g, "_");

  models.sequelize
    .query(`SELECT * from giros_recibidos_caja1('${caja_codigo}','${opcion}','${estado}','${beneficiario}','${solicitante}', '${fechai}', '${fechaf}')`, {
      type: models.sequelize.QueryTypes.SELECT
    })
    .then(lista => {
      let listaTransferencias = [];
      lista.forEach(fila => {
        listaTransferencias.push({
          ...fila,
          solicitud_fecha_hora: moment(fila.solicitud_fecha_hora)
            .locale("es")
            .format("DD/MM/Y HH:mm:ss"),
          fecha_hora:
            fila.fecha_hora !== null
              ? moment(fila.fecha_hora)
                  .locale("es")
                  .format("DD/MM/Y HH:mm:ss")
              : "",
          importe_soles: parseFloat(fila.importe_soles),
          comision_dt: parseFloat(fila.comision_dt),
          comision_banco: parseFloat(fila.comision_banco),
          gastos_administrativos: parseFloat(fila.gastos_administrativos),
          st_estado:
            fila.st_estado === 1
              ? "PENDIENTE"
              : fila.st_estado === 2
              ? "PAGADO"
              : fila.st_estado === 3
              ? "REEMBOLSO"
              : fila.st_estado === 4
              ? "ANULADO"
              : null
        });
      });

      var workbook = new Excel.Workbook();
      workbook.creator = "Money Express Center";
      workbook.lastModifiedBy = "Money Express Center";
      workbook.created = new Date();
      workbook.modified = new Date();
      workbook.views = [
        {
          x: 0,
          y: 0,
          width: 600,
          height: 600,
          firstSheet: 0,
          activeTab: 0,
          visibility: "visible"
        }
      ];
      let hoja_recibidos = workbook.addWorksheet("Giros Recibidos");
      construirHojaRecibidos(nombre, listaTransferencias, hoja_recibidos,estado,opcion);
      //CONSTRUIR EXCEL
      res.status(200);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
      res.setHeader("Content-Disposition", `attachment; filename=Recibidos_${caja_nombre}.xlsx`);
      workbook.xlsx.write(res).then(function() {
        res.end();
      });
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: err.message });
      res.status(409).send("Error al generar");
      console.log(err);
    });
};

exports.exceloficina = async (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  const oficinaDestino = req.params.oficina;
  const opcion = req.params.opcion;
  const estado = req.params.estado;
  const beneficiario = req.params.nombre_beneficiario;
  const solicitante = req.params.nombre_solicitante;
  const fechai = req.params.fechai;
  const fechaf = req.params.fechaf;
  let nombre = "TODAS";
  let oficina_nombre = "TODAS";
  if (oficinaDestino != "*") {
    const oficina = await models.oficina.findOne({
      where: {
        oficina_codigo: oficinaDestino
      }
    });
    nombre = oficina.oficina_nombre;
    oficina_nombre = oficina.oficina_nombre.replace(/ /g, "_");
  }

  models.sequelize
    .query(`SELECT * from giros_recibidos_oficina('${oficinaDestino}','${opcion}','${estado}','${beneficiario}','${solicitante}', '${fechai}', '${fechaf}')`, {
      type: models.sequelize.QueryTypes.SELECT
    })
    .then(lista => {
      let listaTransferencias = [];
      lista.forEach(fila => {
        listaTransferencias.push({
          ...fila,
          solicitud_fecha_hora: moment(fila.solicitud_fecha_hora)
            .locale("es")
            .format("DD/MM/Y HH:mm:ss"),
          fecha_hora:
            fila.fecha_hora !== null
              ? moment(fila.fecha_hora)
                  .locale("es")
                  .format("DD/MM/Y HH:mm:ss")
              : "",
          importe_soles: parseFloat(fila.importe_soles),
          comision_dt: parseFloat(fila.comision_dt),
          comision_banco: parseFloat(fila.comision_banco),
          gastos_administrativos: parseFloat(fila.gastos_administrativos),
          st_estado:
            fila.st_estado === 1
              ? "PENDIENTE"
              : fila.st_estado === 2
              ? "PAGADO"
              : fila.st_estado === 3
              ? "REEMBOLSO"
              : fila.st_estado === 4
              ? "ANULADO"
              : null
        });
      });

      var workbook = new Excel.Workbook();
      workbook.creator = "Money Express Center";
      workbook.lastModifiedBy = "Money Express Center";
      workbook.created = new Date();
      workbook.modified = new Date();
      workbook.views = [
        {
          x: 0,
          y: 0,
          width: 600,
          height: 600,
          firstSheet: 0,
          activeTab: 0,
          visibility: "visible"
        }
      ];
      let hoja_recibidos = workbook.addWorksheet("Giros Recibidos");
        construirHojaRecibidosOf(nombre, listaTransferencias, hoja_recibidos, estado, opcion);
      //CONSTRUIR EXCEL
      res.status(200);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
      res.setHeader("Content-Disposition", `attachment; filename=Recibidos_${oficina_nombre}.xlsx`);
      workbook.xlsx.write(res).then(function() {
        res.end();
      });
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: err.message });
      res.status(409).send("Error al generar");
      console.log(err);
    });
};

exports.excelempresa = async (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  const empresaDestino = req.params.empresa;
  const opcion = req.params.opcion;
  const estado = req.params.estado;
  const beneficiario = req.params.nombre_beneficiario;
  const solicitante = req.params.nombre_solicitante;
  const fechai = req.params.fechai;
  const fechaf = req.params.fechaf;
  let empresa_nombre = "";
  let nombre = "";
  if (empresaDestino != "*") {
    const empresa = await models.empresa.findOne({
      where: {
        empresa_codigo: empresaDestino
      }
    });
    nombre = empresa.razon_social;
    empresa_nombre = empresa.razon_social.replace(/ /g, "_");
  }

  models.sequelize
    .query(`SELECT * from giros_recibidos_empresa1('${empresaDestino}','${opcion}','${estado}','${beneficiario}','${solicitante}', '${fechai}', '${fechaf}')`, {
      type: models.sequelize.QueryTypes.SELECT
    })
    .then(lista => {
      let listaTransferencias = [];
      lista.forEach(fila => {
        listaTransferencias.push({
          ...fila,
          solicitud_fecha_hora: moment(fila.solicitud_fecha_hora)
            .locale("es")
            .format("DD/MM/Y HH:mm:ss"),
          fecha_hora:
            fila.fecha_hora !== null
              ? moment(fila.fecha_hora)
                  .locale("es")
                  .format("DD/MM/Y HH:mm:ss")
              : "",
          importe_soles: parseFloat(fila.importe_soles),
          comision_dt: parseFloat(fila.comision_dt),
          comision_banco: parseFloat(fila.comision_banco),
          gastos_administrativos: parseFloat(fila.gastos_administrativos),
          st_estado:
            fila.st_estado === 1
              ? "PENDIENTE"
              : fila.st_estado === 2
              ? "PAGADO"
              : fila.st_estado === 3
              ? "REEMBOLSO"
              : fila.st_estado === 4
              ? "ANULADO"
              : null
        });
      });

      var workbook = new Excel.Workbook();
      workbook.creator = "Money Express Center";
      workbook.lastModifiedBy = "Money Express Center";
      workbook.created = new Date();
      workbook.modified = new Date();
      workbook.views = [
        {
          x: 0,
          y: 0,
          width: 600,
          height: 600,
          firstSheet: 0,
          activeTab: 0,
          visibility: "visible"
        }
      ];
      let hoja_recibidos = workbook.addWorksheet("Giros Recibidos");
        construirHojaRecibidos(nombre, listaTransferencias, hoja_recibidos, estado, opcion);
      
      //CONSTRUIR EXCEL
      res.status(200);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
      res.setHeader("Content-Disposition", `attachment; filename=Recibidos_${empresa_nombre}.xlsx`);
      workbook.xlsx.write(res).then(function() {
        res.end();
      });
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: err.message });
      res.status(409).send("Error al generar");
      console.log(err);
    });
};

function construirHojaRecibidosOf(oficina_nombre, listaRecibidos, hoja_recibidos, modulo, opcion) {
  hoja_recibidos.getCell("A1").alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true
  };
  hoja_recibidos.getCell("A2").alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true
  };
  hoja_recibidos.getCell("A3").alignment = {
    horizontal: "center",
    wrapText: true
  };
  //COMBINAR CELDAS

  hoja_recibidos.mergeCells("A1", "N1");
  hoja_recibidos.getCell("A1").value = oficina_nombre;
  hoja_recibidos.getRow(1).height = 30;
  hoja_recibidos.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF202355"
    }
  };
  hoja_recibidos.getCell("A1").font = {
    name: "Calibri",
    size: 18,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  hoja_recibidos.mergeCells("A2", "N2");
  hoja_recibidos.getCell("A2").value = "Giros Recibidos";
  hoja_recibidos.getRow(2).height = 30;
  hoja_recibidos.getCell("A2").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF202355"
    }
  };
  hoja_recibidos.getCell("A2").font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  hoja_recibidos.mergeCells("A3", "D3");
  hoja_recibidos.getCell("A3").value = "Sub Totales";
  hoja_recibidos.getRow(3).height = 30;

  //ENCABEZADOS
  hoja_recibidos.getRow(4).values = [
    "Nro",
    "Oficina Origen",
    "Oficina Destino",
    "Nº Solicitud",
    "Beneficiario",
    "Solicitante",
    "Fecha Solicitud",
    opcion === "1"
      ? "Fecha Pago"
      : modulo === "0"
      ? "Fecha Operación"
      : modulo === "1" || modulo === "2" || modulo === "5"
      ? "Fecha Pagado"
      : modulo === "3"
      ? "Fecha Reembolso"
      : modulo === "4"
      ? "Fecha Anulación"
      : null,
    "Importe S/.",
    "Derecho de transferencia",
    "Comision Banco",
    "Gastos Administrativos",
    "Estado",
    "Observación"
  ];

  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4", "L4","M4","N4"].map(key => {
    hoja_recibidos.getCell(key).alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true
    };
  });
  hoja_recibidos.getRow(4).height = 50;

  //IDENTIFICADORES COLUMNAS
  hoja_recibidos.columns = [
    {
      key: "nro",
      width: 5
    },
    {
      key: "oficinaorigen",
      width: 25
    },
    {
      key: "oficinadestino",
      width: 25
    },
    {
      key: "nro_Solicitud",
      width: 12
    },
    {
      key: "beneficiario_razon_social",
      width: 35
    },
    {
      key: "solicitante_razon_social",
      width: 35
    },
    {
      key: "solicitud_fecha_hora",
      width: 22
    },
    {
      key: "fecha_hora",
      width: 22
    },
    {
      key: "importe_soles",
      width: 17
    },
    {
      key: "comision_dt",
      width: 14
    },
    {
      key: "comision_banco",
      width: 14
    },
    {
      key: "gastos_administrativos",
      width: 15
    },
    {
      key: "st_estado",
      width: 12
    },
    {
      key: "solicitud_obs",
      width: 37
    }
  ];

  //ESTILOS FILAS 3 Y 4
  ["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3", "I3", "J3", "K3", "L3","M3","N3"].map(key => {
    hoja_recibidos.getCell(key).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FF202355"
      }
    };
  });

  hoja_recibidos.getCell("A3").font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  ["I3", "J3", "K3","L3"].map(key => {
    hoja_recibidos.getCell(key).font = {
      name: "Calibri",
      size: 11,
      bold: false,
      color: {
        argb: "FFFFFFFF"
      }
    };
  });

  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4", "L4","M4","N4"].map(key => {
    hoja_recibidos.getCell(key).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FF7D7F7D"
      }
    };
  });
  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4", "L4","M4","N4"].map(key => {
    hoja_recibidos.getCell(key).font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: {
        argb: "FF000000"
      }
    };
  });
  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4", "L4","M4","N4"].map(key => {
    hoja_recibidos.getCell(key).border = {
      left: {
        style: "thin",
        color: {
          argb: "FF202355"
        }
      },
      right: {
        style: "thin",
        color: {
          argb: "FF202355"
        }
      }
    };
  });

  //FORMATO DE CELDAS
  hoja_recibidos.getColumn(7).numFmt = "dd/mm/yyyy h:mm:ss";
  hoja_recibidos.getColumn(8).numFmt = "dd/mm/yyyy h:mm:ss";
  hoja_recibidos.getColumn(9).numFmt = '_-"S/."* #,##0.00;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_recibidos.getColumn(10).numFmt = '_-"S/."* #,##0.00;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_recibidos.getColumn(11).numFmt = '_-"S/."* #,##0.00;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_recibidos.getColumn(12).numFmt = '_-"S/."* #,##0.00;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';

  //AGREGAR FILAS
  hoja_recibidos.addRows(listaRecibidos);
  //FORMULAS
  hoja_recibidos.getCell("I3").value = {
    formula: "SUM(I5:I10000)"
  };
  hoja_recibidos.getCell("J3").value = {
    formula: "SUM(J5:J10000)"
  };
  hoja_recibidos.getCell("K3").value = {
    formula: "SUM(K5:K10000)"
  };
  hoja_recibidos.getCell("L3").value = {
    formula: "SUM(L5:L10000)"
  };
  //FILTROS
  hoja_recibidos.autoFilter = {
    from: {
      row: 4,
      column: 1
    },
    to: {
      row: 10000,
      column: 11
    }
  };

  return hoja_recibidos;
}

function construirHojaRecibidos(oficina_nombre, listaRecibidos, hoja_recibidos, modulo, opcion) {
  hoja_recibidos.getCell("A1").alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true
  };
  hoja_recibidos.getCell("A2").alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true
  };
  hoja_recibidos.getCell("A3").alignment = {
    horizontal: "center",
    wrapText: true
  };
  //COMBINAR CELDAS

  hoja_recibidos.mergeCells("A1", "M1");
  hoja_recibidos.getCell("A1").value = oficina_nombre;
  hoja_recibidos.getRow(1).height = 30;
  hoja_recibidos.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF202355"
    }
  };
  hoja_recibidos.getCell("A1").font = {
    name: "Calibri",
    size: 18,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  hoja_recibidos.mergeCells("A2", "M2");
  hoja_recibidos.getCell("A2").value = "Giros Recibidos";
  hoja_recibidos.getRow(2).height = 30;
  hoja_recibidos.getCell("A2").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF202355"
    }
  };
  hoja_recibidos.getCell("A2").font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  hoja_recibidos.mergeCells("A3", "D3");
  hoja_recibidos.getCell("A3").value = "Sub Totales";
  hoja_recibidos.getRow(3).height = 30;

  //ENCABEZADOS

  hoja_recibidos.getRow(4).values = [
    "Nro",
    "Oficina Origen",
    "Nº Solicitud",
    "Beneficiario",
    "Solicitante",
    "Fecha Solicitud",
    opcion === "1"
      ? "Fecha Pago"
      : modulo === "0"
      ? "Fecha Operación"
      : modulo === "1" || modulo === "2" || modulo === "5"
      ? "Fecha Pagado"
      : modulo === "3"
      ? "Fecha Reembolso"
      : modulo === "4"
      ? "Fecha Anulación"
      : null,
    "Importe S/.",
    "Derecho de transferencia",
    "Comision Banco",
    "Gastos Administrativos",
    "Estado",
    "Observación"
  ];

  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4","L4","M4"].map(key => {
    hoja_recibidos.getCell(key).alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true
    };
  });
  hoja_recibidos.getRow(4).height = 50;

  //IDENTIFICADORES COLUMNAS
  hoja_recibidos.columns = [
    {
      key: "nro",
      width: 5
    },
    {
      key: "oficinaorigen",
      width: 25
    },
    {
      key: "nro_Solicitud",
      width: 12
    },
    {
      key: "beneficiario_razon_social",
      width: 35
    },
    {
      key: "solicitante_razon_social",
      width: 35
    },
    {
      key: "solicitud_fecha_hora",
      width: 22
    },
    {
      key: "fecha_hora",
      width: 22
    },
    {
      key: "importe_soles",
      width: 17
    },
    {
      key: "comision_dt",
      width: 14
    },
    {
      key: "comision_banco",
      width: 14
    },
    {
      key: "gastos_administrativos",
      width: 15
    },
    {
      key: "st_estado",
      width: 12
    },
    {
      key: "solicitud_obs",
      width: 37
    }
  ];

  //ESTILOS FILAS 3 Y 4
  ["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3", "I3", "J3", "K3","L3","M3"].map(key => {
    hoja_recibidos.getCell(key).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FF202355"
      }
    };
  });

  hoja_recibidos.getCell("A3").font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  ["H3", "I3", "J3","K3"].map(key => {
    hoja_recibidos.getCell(key).font = {
      name: "Calibri",
      size: 11,
      bold: false,
      color: {
        argb: "FFFFFFFF"
      }
    };
  });

  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4","L4","M4"].map(key => {
    hoja_recibidos.getCell(key).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FF7D7F7D"
      }
    };
  });
  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4","L4","M4"].map(key => {
    hoja_recibidos.getCell(key).font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: {
        argb: "FF000000"
      }
    };
  });
  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4","L4","M4"].map(key => {
    hoja_recibidos.getCell(key).border = {
      left: {
        style: "thin",
        color: {
          argb: "FF202355"
        }
      },
      right: {
        style: "thin",
        color: {
          argb: "FF202355"
        }
      }
    };
  });

  //FORMATO DE CELDAS
  hoja_recibidos.getColumn(6).numFmt = "dd/mm/yyyy h:mm";
  hoja_recibidos.getColumn(7).numFmt = "dd/mm/yyyy h:mm";
  hoja_recibidos.getColumn(8).numFmt = '_-"S/."* #,##0.00;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_recibidos.getColumn(9).numFmt = '_-"S/."* #,##0.00;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_recibidos.getColumn(10).numFmt = '_-"S/."* #,##0.00;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_recibidos.getColumn(11).numFmt = '_-"S/."* #,##0.00;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';

  //AGREGAR FILAS
  hoja_recibidos.addRows(listaRecibidos);
  //FORMULAS
  hoja_recibidos.getCell("H3").value = {
    formula: "SUM(H5:H10000)"
  };
  hoja_recibidos.getCell("I3").value = {
    formula: "SUM(I5:I10000)"
  };
  hoja_recibidos.getCell("J3").value = {
    formula: "SUM(J5:J10000)"
  };
  hoja_recibidos.getCell("K3").value = {
    formula: "SUM(K5:K10000)"
  };
  //FILTROS
  hoja_recibidos.autoFilter = {
    from: {
      row: 4,
      column: 1
    },
    to: {
      row: 10000,
      column: 11
    }
  };

  return hoja_recibidos;
}
