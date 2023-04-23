const Sequelize = require("sequelize");
var PdfPrinter = require("pdfmake");
const models = require("../models");
const moment = require("moment");
const utils = require("../services/utils")
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.cuentas_contables = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, async (err, usuario) => {
      usuario = JSON.parse(usuario);
      const id_cuenta = req.body.id_cuenta;
      const oficina = req.body.oficina;
      const razonsocial = req.body.razonsocial;
      const fecha_inicio = req.body.fecha_inicio;
      const fecha_fin = req.body.fecha_fin;

      models.sequelize
        .query(`select * from buscar_cuentas2('${id_cuenta}','${oficina}','${razonsocial}','${fecha_inicio}','${fecha_fin}');`, {
          type: models.sequelize.QueryTypes.SELECT
        })
        .then(resp => {
          models.sequelize
            .query(`select * from saldos_cuenta_contables('${id_cuenta}');`, {
              type: models.sequelize.QueryTypes.SELECT
            })
            .then(saldos => {
              let saldo1Ingre = saldos[0].moneda1Ingre;
              let saldo2Ingre = saldos[0].moneda2Ingre;
              let saldo1Egre = saldos[0].moneda1Egre;
              let saldo2Egre = saldos[0].moneda2Egre;
              res.json({ operaciones: resp, saldos: { saldo1Ingre, saldo2Ingre, saldo1Egre, saldo2Egre } });
            });
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
          res.status(409).send(err);
          console.log(err);
        });
    });
  });
};

exports.resumen_saldos = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, async (err, usuario) => {
      usuario = JSON.parse(usuario);
      let fecha = req.params.fecha_fin;
      fecha = fecha ? fecha : "";
      console.log(fecha);
      models.sequelize
        .query(`select * from saldos_contables(${fecha && "'" + fecha + "'"})`, {
          type: models.sequelize.QueryTypes.SELECT
        })
        .then(totales => {
          res.json(totales);
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: err.message });
          res.status(409).send("Error");
          console.log(err);
        });
    });
  });
};

exports.resumen_saldos_empresas = (req, res) =>{
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, async (err, usuario) => {
      usuario = JSON.parse(usuario);
      let fecha = req.params.fecha_fin;
      fecha = fecha ? fecha : "";
      console.log(fecha);
      models.sequelize
        .query(`select * from saldos_contables_empresas(${fecha && "'" + fecha + "'"})`, {
          type: models.sequelize.QueryTypes.SELECT
        })
        .then(totales => {
          res.json(totales);
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: err.message });
          res.status(409).send("Error");
          console.log(err);
        });
    });
  });
}

exports.listarsaldosafiliados = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, async (err, usuario) => {
      usuario = JSON.parse(usuario);
      let fecha = req.params.fecha_fin;
      fecha = fecha ? fecha : "";
      models.sequelize
        .query(`select * from saldos_contables(${fecha && "'" + fecha + "'"})`, {
          type: models.sequelize.QueryTypes.SELECT
        })
        .then(lista => {
          var ops = lista.map(function(item) {
            let arrValores = Object.values(item);
            arrValores[0] = {
              text: arrValores[2],
              noWrap: false,
              alignment: "left"
            };
            arrValores[1] = {
              text: arrValores[3],
              noWrap: false,
              alignment: "left",
              fillColor: arrValores[4] === "Propio" ? "#fff9bd" : null
            };
            arrValores[2] = {
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[6]),
              noWrap: false,
              alignment: "right"
            };
            arrValores[3] = {
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[7]),
              noWrap: false,
              alignment: "right"
            };
            arrValores[4] = {
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[8]),
              noWrap: true,
              alignment: "right"
            };
            arrValores[5] = {
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[9]),
              noWrap: true,
              alignment: "right"
            };
            arrValores[6] = {
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[10]),
              noWrap: true,
              alignment: "right"
            };
            arrValores[7] = {
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[11]),
              noWrap: true,
              alignment: "right"
            };
            arrValores[8] = {
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[12]),
              noWrap: true,
              alignment: "right"
            };
            arrValores[9] = {
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[13]),
              noWrap: true,
              alignment: "right"
            };
            arrValores[10] = {
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[14]),
              noWrap: true,
              alignment: "right"
            };
            arrValores[11] = {
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[15]),
              noWrap: true,
              alignment: "right"
            };
            arrValores[12] = {
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[16]),
              noWrap: true,
              alignment: "right"
            };
            
            arrValores.splice(13, 4);
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
            pageMargins: [10, 40, 10, 40],
            content: [
              {
                text: "Saldos Afiliados",
                style: "titulo"
              },
              {
                text: `${fecha}`,
                style: "rangoFecha"
              },
              {
                style: "tabla",
                table: {
                  // headers are automatically repeated if the table spans over multiple pages
                  // you can declare how many rows should be treated as headers
                  headerRows: 1,
                  // ANCHO DE  CADA COLUMNA
                  widths: [37, 60, "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto",30,30],
                  body: [
                    [
                      "Cod.Oficina",
                      "Oficina",
                      { text: "Saldo FastSuo2", alignment: "right" },
                      { text: "Saldo Contable", alignment: "right" },
                      { text: "Saldo Real", alignment: "right" },
                      { text: "Acreedor", alignment: "right" },
                      { text: "Deudor", alignment: "right" },
                      { text: "Pendientes", alignment: "right" },
                      { text: "Recaudadas", alignment: "right" },
                      { text: "Recibidas", alignment: "right" },
                      { text: "Pagadas", alignment: "right" },
                      { text: "DT Anuladas", alignment: "right" },
                      { text: "Cambio destino", alignment: "right" }
                    ],
                    ...ops
                  ]
                },
                layout: {
                  hLineWidth: function(i, node) {
                    return i === 1 || i === node.table.body.length ? 1 : 0;
                  },
                  vLineWidth: function(i, node) {
                    return 0;
                  },
                  hLineColor: function(i, node) {
                    return i === 1 || i === node.table.body.length ? "black" : "gray";
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
                    return rowIndex > 0 && rowIndex % 2 === 1 ? "#e6e6e6" : null;
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
                //margin: [10, 0, 10, 0],
                fontSize: 7
              },
              titulo: {
                fontSize: 18,
                bold: true,
                alignment: "center",
                margin: [0, 10, 0, 4]
              },
              subtitulo: {
                fontSize: 13,
                bold: true,
                alignment: "center",
                margin: [0, 20, 0, 4]
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
                margin: [0, 0, 0, 15]
              },
              saldos: {
                fontSize: 8,
                bold: true,
                alignment: "left",
                margin: [20, 0, 0, 8]
              },
              monto: {
                fontSize: 8,
                bold: false,
                alignment: "right"
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
              `attachment; filename=SaldosAfiliados_${moment()
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
    });
  });
};

exports.listarsaldosafiliadosempresas = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, async (err, usuario) => {
      usuario = JSON.parse(usuario);
      let fecha = req.params.fecha_fin;
      fecha = fecha ? fecha : "";
      models.sequelize
        .query(`select * from saldos_contables_empresas(${fecha && "'" + fecha + "'"})`, {
          type: models.sequelize.QueryTypes.SELECT
        })
        .then(lista => {
          var ops = lista.map(function(item) {
            let arrValores = Object.values(item);
            arrValores[0] = {
              text: arrValores[0],
              noWrap: false,
              alignment: "left"
            };
            arrValores[1] = {
              text: arrValores[1],
              noWrap: false,
              alignment: "left"
            };
            arrValores[2] = {
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[2]),
              noWrap: false,
              alignment: "right"
            };
            arrValores[3] = {
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[3]),
              noWrap: false,
              alignment: "right"
            };
            arrValores[4] = {
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[4]),
              noWrap: true,
              alignment: "right"
            };
            arrValores[5] = {
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[5]),
              noWrap: true,
              alignment: "right"
            };
            arrValores[6] = {
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[6]),
              noWrap: true,
              alignment: "right"
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
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[9]),
              noWrap: true,
              alignment: "right"
            };
            arrValores[10] = {
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[10]),
              noWrap: true,
              alignment: "right"
            };
            arrValores[11] = {
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[11]),
              noWrap: true,
              alignment: "right"
            };
            arrValores[12] = {
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(arrValores[12]),
              noWrap: true,
              alignment: "right"
            };
            
            //arrValores.pop();
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
            pageMargins: [10, 40, 10, 40],
            content: [
              {
                text: "Saldos Afiliados Empresas",
                style: "titulo"
              },
              {
                text: `${fecha}`,
                style: "rangoFecha"
              },
              {
                style: "tabla",
                table: {
                  // headers are automatically repeated if the table spans over multiple pages
                  // you can declare how many rows should be treated as headers
                  headerRows: 1,
                  // ANCHO DE  CADA COLUMNA
                  widths: [37, 60, "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto", "auto",30,30],
                  body: [
                    [
                      "Cod. Empresa",
                      "Empresa",
                      { text: "Saldo FastSuo2", alignment: "right" },
                      { text: "Saldo Contable", alignment: "right" },
                      { text: "Saldo Real", alignment: "right" },
                      { text: "Acreedor", alignment: "right" },
                      { text: "Deudor", alignment: "right" },
                      { text: "Pendientes", alignment: "right" },
                      { text: "Recaudadas", alignment: "right" },
                      { text: "Recibidas", alignment: "right" },
                      { text: "Pagadas", alignment: "right" },
                      { text: "DT Anuladas", alignment: "right" },
                      { text: "Cambio destino", alignment: "right" }
                    ],
                    ...ops
                  ]
                },
                layout: {
                  hLineWidth: function(i, node) {
                    return i === 1 || i === node.table.body.length ? 1 : 0;
                  },
                  vLineWidth: function(i, node) {
                    return 0;
                  },
                  hLineColor: function(i, node) {
                    return i === 1 || i === node.table.body.length ? "black" : "gray";
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
                    return rowIndex > 0 && rowIndex % 2 === 1 ? "#e6e6e6" : null;
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
                //margin: [10, 0, 10, 0],
                fontSize: 7
              },
              titulo: {
                fontSize: 18,
                bold: true,
                alignment: "center",
                margin: [0, 10, 0, 4]
              },
              subtitulo: {
                fontSize: 13,
                bold: true,
                alignment: "center",
                margin: [0, 20, 0, 4]
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
                margin: [0, 0, 0, 15]
              },
              saldos: {
                fontSize: 8,
                bold: true,
                alignment: "left",
                margin: [20, 0, 0, 8]
              },
              monto: {
                fontSize: 8,
                bold: false,
                alignment: "right"
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
              `attachment; filename=SaldosAfiliados_${moment()
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
    });
  });
};

exports.resumen_saldos_giros = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, async (err, usuario) => {
      usuario = JSON.parse(usuario);
      const fechai = req.body.fecha_inicio;
      const fechaf = req.body.fecha_final;
      models.sequelize
        .query(`select * from saldos_giros('${fechai}','${fechaf}')`, {
          type: models.sequelize.QueryTypes.SELECT
        })
        .then(totales => {
          res.json(totales);
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: err.message });
          res.status(409).send("Error");
          console.log(err);
        });
    });
  });
};

exports.cuentas_contables_centro_costo = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, async (err, usuario) => {
      usuario = JSON.parse(usuario);
      const id_cuenta = req.body.id_cuenta;
      const centro = req.body.centro_costo;
      const razonsocial = req.body.razonsocial;
      const fecha_inicio = req.body.fecha_inicio;
      const fecha_fin = req.body.fecha_fin;

      models.sequelize
        .query(`select * from buscar_cuentasCentro_Costo('${id_cuenta}','${centro}','${razonsocial}','${fecha_inicio}','${fecha_fin}');`, {
          type: models.sequelize.QueryTypes.SELECT
        })
        .then(resp => {
          models.sequelize
            .query(`select * from saldos_cuenta_contables('${id_cuenta}');`, {
              type: models.sequelize.QueryTypes.SELECT
            })
            .then(saldos => {
              let saldo1Ingre = saldos[0].moneda1Ingre;
              let saldo2Ingre = saldos[0].moneda2Ingre;
              let saldo1Egre = saldos[0].moneda1Egre;
              let saldo2Egre = saldos[0].moneda2Egre;
              res.json({ operaciones: resp, saldos: { saldo1Ingre, saldo2Ingre, saldo1Egre, saldo2Egre } });
            });
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
          res.status(409).send(err);
          console.log(err);
        });
    });
  });
};

//pdf cuentas contables por oficina
exports.cuentas_contables_oficina_pdf = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, async (err, usuario) => {
      usuario = JSON.parse(usuario);
      const id_cuenta = req.body.id_cuenta;
      const oficina_body = req.body.oficina;
      const razonsocial = req.body.razonsocial;
      const fecha_inicio = req.body.fecha_inicio;
      const fecha_fin = req.body.fecha_fin;

      let oficina_nombre = "TODAS";
      if (oficina_body != "*") {
        const oficina = await models.oficina.findOne({
          where: {
            oficina_codigo: oficina_body
          }
        });
        oficina_nombre = oficina.oficina_nombre.replace(/ /g, "_");
      }

      models.sequelize
        .query(`SELECT * from buscar_cuentas2('${id_cuenta}','${oficina_body}','${razonsocial}','${fecha_inicio}','${fecha_fin}')`, {
          type: models.sequelize.QueryTypes.SELECT
        })
        .then(lista => {
          models.sequelize
            .query(`SELECT * from saldos_cuenta_contables('${id_cuenta}')`, {
              type: models.sequelize.QueryTypes.SELECT
            })
            .then(saldos => {
              let ingresos = [];
              let egresos = [];
              let saldo1Ingre = 0;
              let saldo2Ingre = 0;
              let saldo1Egre = 0;
              let saldo2Egre = 0; 
              let sum1Ingre = 0;
              let sum2Ingre = 0;
              let sum1Egre = 0;
              let sum2Egre = 0; 
              lista.map(operacion => {
                if(operacion.recibotipo === "INGRESO"){
                  ingresos.push(operacion)
                  sum1Ingre += parseFloat(operacion.moneda1_ingre) || 0;
                  sum2Ingre += parseFloat(operacion.moneda2_ingre) || 0;
                }
                else if(operacion.recibotipo === "EGRESO"){
                  egresos.push(operacion)
                  sum1Egre += parseFloat(operacion.moneda1_egre) || 0;
                  sum2Egre += parseFloat(operacion.moneda2_egre) || 0;
                }
              }) 
                                                
              var ops1 = ingresos.map(function(item) {
                let arrValores1 = Object.values(item);
                arrValores1[0] = {
                  text: arrValores1[0]+arrValores1[1]+'-'+arrValores1[2],
                  noWrap: true,
                  alignment: "left"
                };
                arrValores1[1] = {
                  text: arrValores1[3],
                  noWrap: true,
                  alignment: "left"
                };
                arrValores1[2] = {
                  text: arrValores1[5],
                  noWrap: true,
                  alignment: "left"
                };
                arrValores1[3] = {
                  text: arrValores1[6],
                  noWrap: false
                };
                arrValores1[4] = {
                  text: arrValores1[7],
                  noWrap: false
                };
                arrValores1[5] = {
                  text: moment(arrValores1[8]).format("DD/MM/Y"),
                  noWrap: false
                };
                arrValores1[6] = {
                  text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores1[9]),
                  noWrap: true,
                  alignment: "right"
                };
                arrValores1[7] = {
                  text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores1[11]),
                  noWrap: true,
                  alignment: "right"
                };
                arrValores1.splice(8);
                return arrValores1;
              });
              
              var ops2 = egresos.map(function(item) {
                let arrValores2 = Object.values(item);
                arrValores2[0] = {
                  text: arrValores2[0]+arrValores2[1]+'-'+arrValores2[2],
                  noWrap: true,
                  alignment: "left"
                };
                arrValores2[1] = {
                  text: arrValores2[3],
                  noWrap: true,
                  alignment: "left"
                };
                arrValores2[2] = {
                  text: arrValores2[5],
                  noWrap: true,
                  alignment: "left"
                };
                arrValores2[3] = {
                  text: arrValores2[6],
                  noWrap: false
                };
                arrValores2[4] = {
                  text: arrValores2[7],
                  noWrap: false
                };
                arrValores2[5] = {
                  text: moment(arrValores2[8]).format("DD/MM/Y"),
                  noWrap: false
                };
                arrValores2[6] = {
                  text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores2[9]),
                  noWrap: true,
                  alignment: "right"
                };
                arrValores2[7] = {
                  text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores2[11]),
                  noWrap: true,
                  alignment: "right"
                };
                arrValores2.splice(8);
                return arrValores2;
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
                    text: "Cuentas Contables",
                    style: "titulo"
                  },          
                  {
                    text: oficina_nombre,
                    style: "oficina"
                  },
                  {
                    text: ` Del ${fecha_inicio} Al ${fecha_fin}`,
                    style: "rangoFecha"
                  },
                  {
                    text: "INGRESOS",
                    style: "subtitulo"
                  },
                  {
                    style: "tabla",
                    table: {
                      // headers are automatically repeated if the table spans over multiple pages
                      // you can declare how many rows should be treated as headers
                      headerRows: 1,
                      // ANCHO DE  CADA COLUMNA
                      widths: ["auto", "auto", "auto", "*", "*", "auto", "auto", "auto"],
                      body: [
                        ["Boleta", "Oficina Origen", "Cuenta", "Razón Social", "Concepto", "Fecha", "Importe S/.", "Importe $"],
                        ...ops1,
                        ["","","","","","TOTAL",
                            {text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sum1Ingre)}`,
                              noWrap: true,
                              alignment: "right"},
                            {text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sum2Ingre)}`,
                              noWrap: true,
                              alignment: "right"}]									
                      ]
                    },
                    layout: {
                      hLineWidth: function(i, node) {
                        return i === 1 || i === node.table.body.length-1 ? 1 : 0;
                      },
                      vLineWidth: function(i, node) {
                        return 0;
                      },
                      hLineColor: function(i, node) {
                        return i === 0 || i === node.table.body.length-1 ? "black" : "gray";
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
                        return rowIndex > 0 && rowIndex % 2 === 1 ? "#e6e6e6" : null;
                      }
                    }
                  },
                  {
                    text: "EGRESOS",
                    style: "subtitulo"
                  },
                  {
                    style: "tabla",
                    table: {
                      // headers are automatically repeated if the table spans over multiple pages
                      // you can declare how many rows should be treated as headers
                      headerRows: 1,
                      // ANCHO DE  CADA COLUMNA
                      widths: ["auto", "auto", "auto", "*", "*", "auto", "auto", "auto"],
                      body: [
                        ["Boleta", "Oficina Origen", "Cuenta", "Razón Social", "Concepto", "Fecha", "Importe S/.", "Importe $"],
                        ...ops2,
                        ["","","","","","TOTAL",
                            {text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sum1Egre)}`,
                              noWrap: true,
                              alignment: "right"},
                            {text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sum2Egre)}`,
                              noWrap: true,
                              alignment: "right"}]									
                      ]
                    },
                    layout: {
                      hLineWidth: function(i, node) {
                        return i === 1 || i === node.table.body.length-1 ? 1 : 0;
                      },
                      vLineWidth: function(i, node) {
                        return 0;
                      },
                      hLineColor: function(i, node) {
                        return i === 0 || i === node.table.body.length-1 ? "black" : "gray";
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
                        return rowIndex > 0 && rowIndex % 2 === 1 ? "#e6e6e6" : null;
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
                  subtitulo: {
                    fontSize: 13,
                    bold: true,
                    alignment: "center",
                    margin: [0, 20, 0, 4]
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
                res.setHeader("Content-Disposition", `attachment; filename=Cuentas_Contables_${oficina_nombre}_${moment()
                  .locale("es")
                  .format("DD-MM-YYYY_HH'mm")}.pdf`);
                res.send(result);
              });
              pdfDoc.end();
            })
          
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
          res.status(409).send("Error al generar");
          console.log(err)
        })
      })
  });
};

//pdf cuentas contables por centro de costo
exports.cuentas_contables_centrocosto_pdf = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, async (err, usuario) => {
      usuario = JSON.parse(usuario);
      const id_cuenta = req.body.id_cuenta;
      const centro_body = req.body.centro_costo;
      const razonsocial = req.body.razonsocial;
      const fecha_inicio = req.body.fecha_inicio;
      const fecha_fin = req.body.fecha_fin;
      let centro_nombre = "TODOS";
      if (centro_body != "*") {
        const centro = await models.centro_costo.findOne({
          where: {
            centro_costo_id: centro_body
          }
        });
        centro_nombre = centro.centro_costo_nombre.replace(/ /g, "_");
      }

      models.sequelize
        .query(`SELECT * from buscar_cuentasCentro_Costo('${id_cuenta}','${centro_body}','${razonsocial}','${fecha_inicio}','${fecha_fin}')`, {
          type: models.sequelize.QueryTypes.SELECT
        })
        .then(lista => {
          models.sequelize
            .query(`SELECT * from saldos_cuenta_contables('${id_cuenta}')`, {
              type: models.sequelize.QueryTypes.SELECT
            })
            .then(saldos => {
              let ingresos = [];
              let egresos = [];
              let saldo1Ingre = 0;
              let saldo2Ingre = 0;
              let saldo1Egre = 0;
              let saldo2Egre = 0; 
              let sum1Ingre = 0;
              let sum2Ingre = 0;
              let sum1Egre = 0;
              let sum2Egre = 0; 

              lista.map(operacion => {
                if(operacion.recibotipo === "INGRESO"){
                  ingresos.push(operacion)
                  sum1Ingre += parseFloat(operacion.moneda1_ingre) || 0;
                  sum2Ingre += parseFloat(operacion.moneda2_ingre) || 0;
                }
                else if(operacion.recibotipo === "EGRESO"){
                  egresos.push(operacion)
                  sum1Egre += parseFloat(operacion.moneda1_egre) || 0;
                  sum2Egre += parseFloat(operacion.moneda2_egre) || 0;
                }
              })         

              var ops1 = ingresos.map(function(item) {
                //console.log(item)
                let arrValores1 = Object.values(item);                
                arrValores1[0] = {
                  text: arrValores1[0]+arrValores1[1]+'-'+arrValores1[2],
                  noWrap: true,
                  alignment: "left"
                };
                arrValores1[1] = {
                  text: arrValores1[3],
                  noWrap: true,
                  alignment: "left"
                };
                arrValores1[2] = {
                  text: arrValores1[5],
                  noWrap: true,
                  alignment: "left"
                };
                arrValores1[3] = {
                  text: arrValores1[6],
                  noWrap: false
                };
                arrValores1[4] = {
                  text: arrValores1[7],
                  noWrap: false
                };
                arrValores1[5] = {
                  text: moment(arrValores1[8]).format("DD/MM/Y"),
                  noWrap: false
                };
                arrValores1[6] = {
                  text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores1[9]),
                  noWrap: true,
                  alignment: "right"
                };
                arrValores1[7] = {
                  text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores1[11]),
                  noWrap: true,
                  alignment: "right"
                };
                arrValores1.splice(8);
                return arrValores1;
              });
              
              var ops2 = egresos.map(function(item) {
                let arrValores2 = Object.values(item);
                arrValores2[0] = {
                  text: arrValores2[0]+arrValores2[1]+'-'+arrValores2[2],
                  noWrap: true,
                  alignment: "left"
                };
                arrValores2[1] = {
                  text: arrValores2[3],
                  noWrap: true,
                  alignment: "left"
                };
                arrValores2[2] = {
                  text: arrValores2[5],
                  noWrap: true,
                  alignment: "left"
                };
                arrValores2[3] = {
                  text: arrValores2[6],
                  noWrap: false
                };
                arrValores2[4] = {
                  text: arrValores2[7],
                  noWrap: false
                };
                arrValores2[5] = {
                  text: moment(arrValores2[8]).format("DD/MM/Y"),
                  noWrap: false
                };
                arrValores2[6] = {
                  text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores2[10]),
                  noWrap: true,
                  alignment: "right"
                };
                arrValores2[7] = {
                  text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores2[12]),
                  noWrap: true,
                  alignment: "right"
                };
                arrValores2.splice(8);
                return arrValores2;
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
                    text: "Cuentas Contables",
                    style: "titulo"
                  },          
                  {
                    text: centro_nombre,
                    style: "oficina"
                  },
                  {
                    text: ` Del ${fecha_inicio} Al ${fecha_fin}`,
                    style: "rangoFecha"
                  },
                  {
                    text: "INGRESOS",
                    style: "subtitulo"
                  },
                  {
                    style: "tabla",
                    table: {
                      // headers are automatically repeated if the table spans over multiple pages
                      // you can declare how many rows should be treated as headers
                      headerRows: 1,
                      // ANCHO DE  CADA COLUMNA
                      widths: ["auto", "auto", "auto", "*", "*", "auto", "auto", "auto"],
                      body: [
                        ["Boleta", "Centro Costo", "Cuenta", "Razón Social", "Concepto", "Fecha", "Importe S/.", "Importe $"],
                        ...ops1,
                        ["","","","","","TOTAL",
                            {text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sum1Ingre)}`,
                              noWrap: true,
                              alignment: "right"},
                            {text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sum2Ingre)}`,
                              noWrap: true,
                              alignment: "right"}]									
                      ]
                    },
                    layout: {
                      hLineWidth: function(i, node) {
                        return i === 1 || i === node.table.body.length-1 ? 1 : 0;
                      },
                      vLineWidth: function(i, node) {
                        return 0;
                      },
                      hLineColor: function(i, node) {
                        return i === 0 || i === node.table.body.length-1 ? "black" : "gray";
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
                        return rowIndex > 0 && rowIndex % 2 === 1 ? "#e6e6e6" : null;
                      }
                    }
                  },
                  {
                    text: "EGRESOS",
                    style: "subtitulo"
                  },
                  {
                    style: "tabla",
                    table: {
                      // headers are automatically repeated if the table spans over multiple pages
                      // you can declare how many rows should be treated as headers
                      headerRows: 1,
                      // ANCHO DE  CADA COLUMNA
                      widths: ["auto", "auto", "auto", "*", "*", "auto", "auto", "auto"],
                      body: [
                        ["Boleta", "Centro Costo", "Cuenta", "Razón Social", "Concepto", "Fecha", "Importe S/.", "Importe $"],
                        ...ops2,
                        ["","","","","","TOTAL",
                            {text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sum1Egre)}`,
                              noWrap: true,
                              alignment: "right"},
                            {text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sum2Egre)}`,
                              noWrap: true,
                              alignment: "right"}]									
                      ]
                    },
                    layout: {
                      hLineWidth: function(i, node) {
                        return i === 1 || i === node.table.body.length-1 ? 1 : 0;
                      },
                      vLineWidth: function(i, node) {
                        return 0;
                      },
                      hLineColor: function(i, node) {
                        return i === 0 || i === node.table.body.length-1 ? "black" : "gray";
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
                        return rowIndex > 0 && rowIndex % 2 === 1 ? "#e6e6e6" : null;
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
                  subtitulo: {
                    fontSize: 13,
                    bold: true,
                    alignment: "center",
                    margin: [0, 20, 0, 4]
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
                res.setHeader("Content-Disposition", `attachment; filename=Cuentas_Contables_${centro_nombre}_${moment()
                  .locale("es")
                  .format("DD-MM-YYYY_HH'mm")}.pdf`);
                res.send(result);
              });
              pdfDoc.end();
            })
          
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
          res.status(409).send("Error al generar");
          console.log(err)
        })
      })
  });
};
