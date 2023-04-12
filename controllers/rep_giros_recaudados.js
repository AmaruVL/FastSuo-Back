const Sequelize = require("sequelize");
var PdfPrinter = require("pdfmake");
const Excel = require("exceljs");
const models = require("../models");
const moment = require("moment");
import utils from "../services/utils";
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.detalle_caja = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];

  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      var caja_codigo = req.body.caja_codigo ? req.body.caja_codigo : usuario.caja_codigo;
      var beneficiario = req.body.nombre_beneficiario;
      var solicitante = req.body.nombre_solicitante;
      var opcion_fecha = req.body.opcion_fecha;
      var estado = req.body.estado;
      var fecha_inicio = req.body.fecha_inicio;
      var fecha_final = req.body.fecha_final;

      models.sequelize
        .query(`select * from recaudadosCaja1('${caja_codigo}','${beneficiario}','${solicitante}','${opcion_fecha}','${estado}','${fecha_inicio}','${fecha_final}');`, {
          type: models.sequelize.QueryTypes.SELECT
        })
        .then(lista => {
          res.json(lista);
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, err });
          res.json({
            error: err.errors
          });
        });
    });
  });
};

exports.detalle_oficina = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];

  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      var oficina_codigo = req.body.oficina_codigo ? req.body.oficina_codigo : usuario.oficina_codigo;
      var beneficiario = req.body.nombre_beneficiario;
      var solicitante = req.body.nombre_solicitante;
      var opcion_fecha = req.body.opcion_fecha;
      var estado = req.body.estado;
      var fecha_inicio = req.body.fecha_inicio;
      var fecha_final = req.body.fecha_final;
      models.sequelize
        .query(`select * from recaudadosOficina1('${oficina_codigo}','${beneficiario}','${solicitante}','${opcion_fecha}','${estado}','${fecha_inicio}','${fecha_final}');`, {
          type: models.sequelize.QueryTypes.SELECT
        })
        .then(lista => {
          res.json(lista);
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, err });
          res.json({
            error: err.errors
          });
        });
    });
  });
};

exports.detalle_empresa = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];

  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, (err, usuario) => {
      usuario = JSON.parse(usuario);
      var empresa_codigo = req.body.empresa_codigo;
      var beneficiario = req.body.nombre_beneficiario;
      var solicitante = req.body.nombre_solicitante;
      var opcion_fecha = req.body.opcion_fecha;
      var estado = req.body.estado;
      var fecha_inicio = req.body.fecha_inicio;
      var fecha_final = req.body.fecha_final;
      models.sequelize
        .query(`select * from recaudadosEmpresa1('${empresa_codigo}','${beneficiario}','${solicitante}','${opcion_fecha}','${estado}','${fecha_inicio}','${fecha_final}');`, {
          type: models.sequelize.QueryTypes.SELECT
        })
        .then(lista => {
          res.json(lista);
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, err });
          res.json({
            error: err.errors
          });
        });
    });
  });
};

exports.listarecaudadosCaja = (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
		//OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, async(err, usuario) => {
      usuario = JSON.parse(usuario);
      const cajaDestino = req.body.caja_codigo ? req.body.caja_codigo : usuario.caja_codigo;
      var beneficiario = req.body.nombre_beneficiario;
      var solicitante = req.body.nombre_solicitante;
      var opcion_fecha = req.body.opcion_fecha;
      const estado = req.body.estado;
      const fechai = req.body.fecha_inicio;
      const fechaf = req.body.fecha_final;
      let nombre="";
      let caja_nombre = "";
      const caja = await models.caja.findOne({
        where: {
          caja_codigo: cajaDestino
        }
      });
      caja_nombre = caja.caja_nombre.replace(/ /g, "_");
      nombre =  caja.caja_nombre;  

      models.sequelize
        .query(`SELECT * from recaudadosCaja1('${cajaDestino}','${beneficiario}','${solicitante}','${opcion_fecha}','${estado}', '${fechai}', '${fechaf}')`, {
          type: models.sequelize.QueryTypes.SELECT
        })
        .then(lista => {
          var sumS=0.00;
          var sumDT=0.00;
          var sumBan=0.00;
          var sumD=0.00;                        
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
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(parseFloat(arrValores[7])+parseFloat(arrValores[9])),
              noWrap: true,
              alignment: "right"
            };
            arrValores[7] = {
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores[8]),
              noWrap: true,
              alignment: "right"
            };
            arrValores[8] = {
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores[10]),
              noWrap: true,
              alignment: "right"
            };
            arrValores.splice(9);
            return arrValores;
          });
          for(var i=0;i<lista.length;i++){
            sumS=sumS+ parseFloat(lista[i].importe_soles)+ parseFloat(lista[i].gastos_administrativos);
            sumDT=sumDT+ parseFloat(lista[i].comision_dt);
            //sumD=sumD+ parseFloat(lista[i].importe_dolares);
            sumBan=sumBan+ parseFloat(lista[i].comision_banco);
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
                text: "Listado de giros recaudados",
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
                      }/*,
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
                  widths: ["auto", "auto", "auto", "*", "*", "auto", "auto", "auto", "auto"],
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
                      {}
                    ],
                    ["Nro", "Destino", "Nro Boleta", "Beneficiario", "Solicitante", "Fecha", "Importe", "DT", "Banco"],
                    ...ops,
                    ["","","","","","TOTAL",
                        {text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumS)}`,
                          noWrap: true,
                          alignment: "right"},
                        {text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumDT)}`,
                          noWrap: true,
                          alignment: "right"},
                        {text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumBan)}`,
                          noWrap: true,
                          alignment: "right"}]									
                  ]
                },
                layout: {
                  hLineWidth: function(i, node) {
                    return i === 2 || i === node.table.body.length-1 ? 1 : 0;
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
            res.setHeader("Content-Disposition", `attachment; filename=GirosRecaudados_${cajaDestino}_${moment().locale("es").format("DD-MM-YYYY_HH'mm")}.pdf`);
            res.send(result);
          });
          pdfDoc.end();
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
          res.status(409).send("Error al generar");
          console.log(err)
        })
      })
    });
};

exports.listarecaudadosOf = async (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  const oficinaDestino = req.params.oficina;
  var beneficiario = req.params.nombre_beneficiario;
  var solicitante = req.params.nombre_solicitante;
  const estado = req.params.estado;
  var opcion_fecha = req.params.opcion_fecha;
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
    .query(`SELECT * from recaudadosOficina1('${oficinaDestino}','${beneficiario}','${solicitante}','${opcion_fecha}','${estado}', '${fechai}', '${fechaf}')`, {
      type: models.sequelize.QueryTypes.SELECT
    })
    .then(lista => {
      var sumS=0.00;
      var sumDT=0.00;
      var sumBan=0.00;
      var sumD=0.00;                        
      var ops = lista.map(function(item) {
        let arrValores = Object.values(item);
        arrValores[0] = {
          text: arrValores[0],
          noWrap: true,
          alignment: "right"
        };
        arrValores[1] = {
          text: arrValores[2],
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
          text: arrValores[3],
          noWrap: true,
          alignment: "right"
        };
        arrValores[3] = {
          text: arrValores[4],
          noWrap: false
        };
        arrValores[4] = {
          text: arrValores[5],
          noWrap: false
        };
        arrValores[5] = {
          text: moment(arrValores[6]).format("DD/MM/Y"),
          noWrap: false
        };
        arrValores[6] = {
          text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(parseFloat(arrValores[8])+parseFloat(arrValores[10])),
          noWrap: true,
          alignment: "right"
        };
        arrValores[7] = {
          text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores[9]),
          noWrap: true,
          alignment: "right"
        };
        arrValores[8] = {
          text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores[11]),
          noWrap: true,
          alignment: "right"
        };
        arrValores.splice(9);
        return arrValores;
      });
      for(var i=0;i<lista.length;i++){
        sumS=sumS+ parseFloat(lista[i].importe_soles)+parseFloat(lista[i].gastos_administrativos);
        sumDT=sumDT+ parseFloat(lista[i].comision_dt);
        //sumD=sumD+ parseFloat(lista[i].importe_dolares);
        sumBan=sumBan+ parseFloat(lista[i].comision_banco);
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
                  text: "REEMBOLSO",
                  color: "#a9a9a9"
                  },
                  {
                    text: "ANULADO",
                    color: "#ff0000"
                  }/*,
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
              widths: ["auto", "auto", "auto", "*", "*", "auto", "auto", "auto", "auto"],
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
                  {}
                ],
                ["Nro", "Destino", "Nro Boleta", "Beneficiario", "Solicitante", "Fecha", "Importe", "DT", "Banco"],
                ...ops,
                ["","","","","","TOTAL",
										{text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumS)}`,
											noWrap: true,
											alignment: "right"},
										{text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumDT)}`,
											noWrap: true,
                      alignment: "right"},
										{text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumBan)}`,
											noWrap: true,
											alignment: "right"}]									
              ]
            },
            layout: {
              hLineWidth: function(i, node) {
                return i === 2 || i === node.table.body.length-1 ? 1 : 0;
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
        res.setHeader("Content-Disposition", `attachment; filename=GirosRecaudados_${oficinaDestino}_${moment().locale("es").format("DD-MM-YYYY_HH'mm")}.pdf`);
        res.send(result);
      });
      pdfDoc.end();
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(409).send("Error al generar");
      console.log(err)
    });
};

exports.listarecaudadosEmp = async (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
  const empresaDestino = req.params.empresa;
  var beneficiario = req.params.nombre_beneficiario;
  var solicitante = req.params.nombre_solicitante;
  var opcion_fecha = req.params.opcion_fecha;
  const estado = req.params.estado;
  const fechai = req.params.fechai;
  const fechaf = req.params.fechaf;
  let nombre = "";
  let empresa_nombre = "";
  const empresa = await models.empresa.findOne({
    where: {
      empresa_codigo: empresaDestino
    }
  });
  nombre = empresa.razon_social;
  empresa_nombre = empresa.razon_social.replace(/ /g, "_");  

  models.sequelize
    .query(`SELECT * from recaudadosEmpresa1('${empresaDestino}','${beneficiario}','${solicitante}','${opcion_fecha}','${estado}', '${fechai}', '${fechaf}')`, {
      type: models.sequelize.QueryTypes.SELECT
    })
    .then(lista => {
      var sumS=0.00;
      var sumDT=0.00;
      var sumBan=0.00;
      var sumD=0.00;                        
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
          text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(parseFloat(arrValores[7])+parseFloat(arrValores[9])),
          noWrap: true,
          alignment: "right"
        };
        arrValores[7] = {
          text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores[8]),
          noWrap: true,
          alignment: "right"
        };
        arrValores[8] = {
          text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores[10]),
          noWrap: true,
          alignment: "right"
        };
        arrValores.splice(9);
        return arrValores;
      });
      for(var i=0;i<lista.length;i++){
        sumS=sumS+ parseFloat(lista[i].importe_soles)+parseFloat(lista[i].gastos_administrativos);
        sumDT=sumDT+ parseFloat(lista[i].comision_dt);
        //sumD=sumD+ parseFloat(lista[i].importe_dolares);
        sumBan=sumBan+ parseFloat(lista[i].comision_banco);
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
            text: "Listado de giros recaudados",
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
                  }/*,
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
              widths: ["auto", "auto", "auto", "*", "*", "auto", "auto", "auto", "auto"],
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
                  {}
                ],
                ["Nro", "Destino", "Nro Boleta", "Beneficiario", "Solicitante", "Fecha", "Importe", "DT", "Banco"],
                ...ops,
                ["","","","","","TOTAL",
										{text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumS)}`,
											noWrap: true,
											alignment: "right"},
										{text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumDT)}`,
											noWrap: true,
                      alignment: "right"},
										{text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumBan)}`,
											noWrap: true,
											alignment: "right"}]									
              ]
            },
            layout: {
              hLineWidth: function(i, node) {
                return i === 2 || i === node.table.body.length-1 ? 1 : 0;
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
        res.setHeader("Content-Disposition", `attachment; filename=GirosRecaudados_${empresaDestino}_${moment().locale("es").format("DD-MM-YYYY_HH'mm")}.pdf`);
        res.send(result);
      });
      pdfDoc.end();
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
      res.status(409).send("Error al generar");
      console.log(err)
    });
};

//--------------
exports.excelcaja = async (req, res) => {
  var logger = req.app.get("winston");
  var redis = req.app.get("redis");
  const token = req.header("Authorization").split(" ")[1];
  utils.decodeToken(token, tokenDecodificado => {
    //OBTENER DATOS DEL USUARIO DESDE REDIS
    redis.get(tokenDecodificado.id, async(err, usuario) => {
      usuario = JSON.parse(usuario);
      var caja_codigo = req.body.caja_codigo ? req.body.caja_codigo : usuario.caja_codigo;
      var beneficiario = req.body.nombre_beneficiario;
      var solicitante = req.body.nombre_solicitante;
      var opcion_fecha = req.body.opcion_fecha;
      var estado = req.body.estado;
      var fecha_inicio = req.body.fecha_inicio;
      var fecha_final = req.body.fecha_final;

      let nombre="";
      let caja_nombre = "";
      const caja = await models.caja.findOne({
        where: {
          caja_codigo: caja_codigo
        }
      });
      caja_nombre = caja.caja_nombre.replace(/ /g, "_");
      nombre =  caja.caja_nombre;  

      models.sequelize
        .query(
          `SELECT * from recaudadosCaja1('${caja_codigo}','${beneficiario}','${solicitante}',''${opcion_fecha},'${estado}', '${fecha_inicio}', '${fecha_final}')`,
          {
            type: models.sequelize.QueryTypes.SELECT
          }
        )
        .then(lista => {
          let listaTransferencias = [];
          lista.forEach(fila => {
            listaTransferencias.push({
              ...fila,
              solicitud_fecha_hora: moment(fila.solicitud_fecha_hora)
                .locale("es")
                .format("DD/MM/Y HH:mm:ss"),
              importe_soles: parseFloat(fila.importe_soles),
              comision_dt: parseFloat(fila.comision_dt),
              comision_banco: parseFloat(fila.comision_banco),
              gastos_administrativos: parseFloat(fila.gastos_administrativos),
              st_estado: fila.st_estado===1 ? "PENDIENTE" : fila.st_estado===2 ? "PAGADO" : 
                        fila.st_estado===3 ? "REEMBOLSO" : fila.st_estado===4 ? "ANULADO" : null
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
          let hoja_recaudados = workbook.addWorksheet("Giros Recaudados");
          construirHojaRecaudados(nombre, listaTransferencias, hoja_recaudados);
          //CONSTRUIR EXCEL
          res.status(200);
          res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
          res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
          res.setHeader("Content-Disposition", `attachment; filename=Recaudados_${caja_nombre}.xlsx`);
          workbook.xlsx.write(res).then(function() {
            res.end();
          });
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: err.message });
          res.status(409).send("Error al generar");
          console.log(err)
        });
    })
  })
};

exports.exceloficina = async (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  const oficinaDestino = req.params.oficina;
  var beneficiario = req.params.nombre_beneficiario;
  var solicitante = req.params.nombre_solicitante;
  const estado = req.params.estado;
  var opcion_fecha = req.params.opcion_fecha;
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
    oficina_nombre = oficina.oficina_nombre.replace(/ /g, "_");
    nombre =  oficina.oficina_nombre;
  }

  models.sequelize
    .query(
      `SELECT * from recaudadosOficina1('${oficinaDestino}','${beneficiario}','${solicitante}','${opcion_fecha}','${estado}', '${fechai}', '${fechaf}')`,
      {
        type: models.sequelize.QueryTypes.SELECT
      }
    )
    .then(lista => {
      let listaTransferencias = [];
      lista.forEach(fila => {
        listaTransferencias.push({
          ...fila,
          solicitud_fecha_hora: moment(fila.solicitud_fecha_hora)
            .locale("es")
            .format("DD/MM/Y HH:mm:ss"),
          importe_soles: parseFloat(fila.importe_soles),
          comision_dt: parseFloat(fila.comision_dt),
          comision_banco: parseFloat(fila.comision_banco),
          gastos_administrativos: parseFloat(fila.gastos_administrativos),
          st_estado: fila.st_estado===1 ? "PENDIENTE" : fila.st_estado===2 ? "PAGADO" : 
                    fila.st_estado===3 ? "REEMBOLSO" : fila.st_estado===4 ? "ANULADO" : null
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
      let hoja_recaudados = workbook.addWorksheet("Giros Recaudados");
      construirHojaRecaudados(nombre, listaTransferencias, hoja_recaudados);
      //CONSTRUIR EXCEL
      res.status(200);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
      res.setHeader("Content-Disposition", `attachment; filename=Recaudados_${oficina_nombre}.xlsx`);
      workbook.xlsx.write(res).then(function() {
        res.end();
      });
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: err.message });
      res.status(409).send("Error al generar");
      console.log(err)
    });
};

exports.excelempresa = async (req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];

  const empresaDestino = req.params.empresa;
  var beneficiario = req.params.nombre_beneficiario;
  var solicitante = req.params.nombre_solicitante;
  var opcion_fecha = req.params.opcion_fecha;
  const estado = req.params.estado;
  const fechai = req.params.fechai;
  const fechaf = req.params.fechaf;
  let nombre = "";
  let empresa_nombre = "";
  const empresa = await models.empresa.findOne({
    where: {
      empresa_codigo: empresaDestino
    }
  });
  nombre = empresa.razon_social;
  empresa_nombre = empresa.razon_social.replace(/ /g, "_");

  models.sequelize
    .query(
      `SELECT * from recaudadosEmpresa1('${empresaDestino}','${beneficiario}','${solicitante}','${opcion_fecha}','${estado}', '${fechai}', '${fechaf}')`,
      {
        type: models.sequelize.QueryTypes.SELECT
      }
    )
    .then(lista => {
      let listaTransferencias = [];
      lista.forEach(fila => {
        listaTransferencias.push({
          ...fila,
          solicitud_fecha_hora: moment(fila.solicitud_fecha_hora)
            .locale("es")
            .format("DD/MM/Y HH:mm:ss"),
          importe_soles: parseFloat(fila.importe_soles),
          comision_dt: parseFloat(fila.comision_dt),
          comision_banco: parseFloat(fila.comision_banco),
          gastos_administrativos: parseFloat(fila.gastos_administrativos),
          st_estado: fila.st_estado===1 ? "PENDIENTE" : fila.st_estado===2 ? "PAGADO" : 
                    fila.st_estado===3 ? "REEMBOLSO" : fila.st_estado===4 ? "ANULADO" : null
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
      let hoja_recaudados = workbook.addWorksheet("Giros Recaudados");
      construirHojaRecaudados(nombre, listaTransferencias, hoja_recaudados);
      //CONSTRUIR EXCEL
      res.status(200);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
      res.setHeader("Content-Disposition", `attachment; filename=Recaudados_${empresa_nombre}.xlsx`);
      workbook.xlsx.write(res).then(function() {
        res.end();
      });
    })
    .catch(err => {
      logger.log("error", { ubicacion: filename, token: token, message: err.message });
      res.status(409).send("Error al generar");
      console.log(err)
    });
};

function construirHojaRecaudados(oficina_nombre, listaRecaudados, hoja_recaudados) {
  hoja_recaudados.getCell("A1").alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true
  };
  hoja_recaudados.getCell("A2").alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true
  };
  hoja_recaudados.getCell("A3").alignment = {
    horizontal: "center",
    wrapText: true
  };
  //COMBINAR CELDAS

  hoja_recaudados.mergeCells("A1", "L1");
  hoja_recaudados.getCell("A1").value = oficina_nombre;
  hoja_recaudados.getRow(1).height = 30;
  hoja_recaudados.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF776E49"
    }
  };
  hoja_recaudados.getCell("A1").font = {
    name: "Calibri",
    size: 18,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  hoja_recaudados.mergeCells("A2", "L2");
  hoja_recaudados.getCell("A2").value = "Giros Recaudados";
  hoja_recaudados.getRow(2).height = 30;
  hoja_recaudados.getCell("A2").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF776E49"
    }
  };
  hoja_recaudados.getCell("A2").font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  hoja_recaudados.mergeCells("A3", "D3");
  hoja_recaudados.getCell("A3").value = "Sub Totales";
  hoja_recaudados.getRow(3).height = 30;

  //ENCABEZADOS

  hoja_recaudados.getRow(4).values = [
    "Nro",
    "Oficina Destino",
    "Nº Solicitud",
    "Beneficiario",
    "Solicitante",
    "Fecha",
    "Importe S/.",
    "Derecho de transferencia",
    "Comision Banco",
    "Gastos Administrativos",
    "Estado",
    "Observación"
  ];

  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4","K4","L4"].map(key => {
    hoja_recaudados.getCell(key).alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true
    };
  });
  hoja_recaudados.getRow(4).height = 50;

  //IDENTIFICADORES COLUMNAS
  hoja_recaudados.columns = [
    {
      key: "nro",
      width: 5
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
  ["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3", "I3", "J3","K3","L3"].map(key => {
    hoja_recaudados.getCell(key).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FF776E49"
      }
    };
  });

  hoja_recaudados.getCell("A3").font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };

  ["F3","G3", "H3", "I3","J3"].map(key => {
    hoja_recaudados.getCell(key).font = {
      name: "Calibri",
      size: 11,
      bold: false,
      color: {
        argb: "FFFFFFFF"
      }
    };
  });

  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4","L4"].map(key => {
    hoja_recaudados.getCell(key).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "FFD0C07A"
      }
    };
  });
  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4","L4"].map(key => {
    hoja_recaudados.getCell(key).font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: {
        argb: "FF000000"
      }
    };
  });
  ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4", "I4", "J4", "K4","L4"].map(key => {
    hoja_recaudados.getCell(key).border = {
      left: {
        style: "thin",
        color: {
          argb: "FF776E49"
        }
      },
      right: {
        style: "thin",
        color: {
          argb: "FF776E49"
        }
      }
    };
  });

  //FORMATO DE CELDAS
  hoja_recaudados.getColumn(6).numFmt = "dd/mm/yyyy h:mm";
  hoja_recaudados.getColumn(7).numFmt = '_-"S/."* #,##0.00;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_recaudados.getColumn(8).numFmt = '_-"S/."* #,##0.00;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_recaudados.getColumn(9).numFmt = '_-"S/."* #,##0.00;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';
  hoja_recaudados.getColumn(10).numFmt = '_-"S/."* #,##0.00;-"S/."* #,##0.00_-;_-"S/."* "-"??_-;_-@_-';

  //AGREGAR FILAS
  hoja_recaudados.addRows(listaRecaudados);
  //FORMULAS
  hoja_recaudados.getCell("G3").value = {
    formula: "SUM(G5:G10000)"
  };
  hoja_recaudados.getCell("H3").value = {
    formula: "SUM(H5:H10000)"
  };
  hoja_recaudados.getCell("I3").value = {
    formula: "SUM(I5:I10000)"
  };
  hoja_recaudados.getCell("J3").value = {
    formula: "SUM(J5:J10000)"
  };
  //FILTROS
  hoja_recaudados.autoFilter = {
    from: {
      row: 4,
      column: 1
    },
    to: {
      row: 10000,
      column: 11
    }
  };

  return hoja_recaudados;
}