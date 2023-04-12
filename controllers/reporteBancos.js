const Sequelize = require("sequelize");
var PdfPrinter = require("pdfmake");
const models = require("../models");
const moment = require("moment");
import utils from "../services/utils";
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.bancos = async (req, res) => {
    var logger = req.app.get("winston");
    const token = req.header("Authorization").split(" ")[1];
    const id_banco = req.params.id_banco;
    const oficina_origen = req.params.oficina_origen;
    const in_usuario = req.params.in_usuario;
    const opcion = req.params.opcion;
    const estado = req.params.estado;
    const tipo = req.params.tipo;
    const fechai = req.params.fechai;
    const fechaf = req.params.fechaf;
  
    models.sequelize
      .query(`SELECT * from bancosRepor('${id_banco}','${oficina_origen}','${in_usuario}', '${opcion}','${estado}','${tipo}','${fechai}','${fechaf}')`, {
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

exports.listargirosBanco = async(req, res) => {
  var logger = req.app.get("winston");
  const token = req.header("Authorization").split(" ")[1];
      const id_banco = req.params.id_banco;
      const oficina_origen = req.params.oficina_origen;
      const in_usuario = req.params.in_usuario;
      const opcion = req.params.opcion;
      const estado = req.params.estado;
      const tipo = req.params.tipo;
      const fechai = req.params.fechai;
      const fechaf = req.params.fechaf;
      let nombre="TODAS";
      let banco_nombre = "TODAS";
      if (id_banco != "*") {
        const banco = await models.entidad_financiera_servicios.findOne({
          where: {
            entidad_codigo: id_banco
          }
        });
        banco_nombre = banco.entidad_razon_social.replace(/ /g, "_");        
        nombre =  banco.entidad_razon_social;
      }

      models.sequelize
        .query(`SELECT * from bancosRepor('${id_banco}','${oficina_origen}', '${in_usuario}', '${opcion}', '${estado}', '${tipo}', '${fechai}', '${fechaf}')`, {
          type: models.sequelize.QueryTypes.SELECT
        })
        .then(lista => {
          var sumImp=0.00;
          var sumBan=0.00;       
          var sumPag=0.00;                 
          var ops = lista.map(function(item) {
            let arrValores = Object.values(item);
            arrValores[0] = {
              text: arrValores[0],
              noWrap: false
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
              noWrap: true,
              alignment: "center"
            };
            arrValores[3] = {
              text: arrValores[3],
              noWrap: false
            };
            arrValores[4] = {
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores[5]),
              noWrap: true,
              alignment: "right"
            };
            arrValores[5] = {
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores[6]),
              noWrap: true,
              alignment: "right"
            };
            arrValores[6] = {
              text: arrValores[7],
              noWrap: true
            };
            arrValores[7] = {
              text: arrValores[8],
              noWrap: false
            };
            arrValores[8] = {
              text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores[9]),
              noWrap: false,
              alignment: "right"
            };
            arrValores[9] = {
              text: arrValores[10],
              noWrap: false
            };
            arrValores.splice(10);
            return arrValores;
          });
          for(var i=0;i<lista.length;i++){
            sumImp+= parseFloat(lista[i].importe);
            sumBan+= parseFloat(lista[i].comision_banco);
            sumPag+= parseFloat(lista[i].importe_pagado);
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
                text: "Listado de giros banco",
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
                  headerRows: 1,
                  // ANCHO DE  CADA COLUMNA
                  widths: [80, "*", "auto", 80, "auto", "auto", "auto", "auto", 30, "*"],
                  body: [
                    ["Entidad", "Origen", "Nro Boleta", "Beneficiario", "Importe", "Banco", "Tipo", "Destino", "Importe Pagado","Nro Cuenta"],
                    ...ops,
                    ["","","","TOTAL",
                        {text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumImp)}`,
                          noWrap: true,
                          alignment: "right"},
                        {text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumBan)}`,
                          noWrap: true,
                          alignment: "right"},"","",
                          {text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumPag)}`,
                          noWrap: false,
                          alignment: "right"},""]					
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
            res.setHeader("Content-Disposition", `attachment; filename=BANCOS_${banco_nombre}_${moment().locale("es").format("DD-MM-YYYY_HH'mm")}.pdf`);
            res.send(result);
          });
          pdfDoc.end();
        })
        .catch(err => {
          logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
          res.status(409).send("Error al generar");
          console.log(err)
        })
};