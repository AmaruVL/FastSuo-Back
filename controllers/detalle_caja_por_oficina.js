const Sequelize = require("sequelize");
var PdfPrinter = require("pdfmake");
const models = require("../models");
const moment = require("moment");
import utils from "../services/utils";
const Op = Sequelize.Op;
var filename = module.filename.split("/").slice(-1);

exports.saldos_oficina = (req,res) =>{
	var logger = req.app.get("winston");
	var redis = req.app.get("redis");	
	const token = req.header("Authorization").split(" ")[1];
	utils.decodeToken(token, tokenDecodificado => {
		//OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, async(err, usuario) => {
            usuario = JSON.parse(usuario);
            var caja_codigo = req.body.caja_cod;
            var fecha_inicio = req.body.fecha_inicio;		
            var fecha_fin = req.body.fecha_fin;

            models.sequelize
            .query(
                `SELECT * FROM saldos_caja2(:fecha_inicio,:fecha_fin,:caja_cod)`,
            {	
                replacements: {
                    fecha_inicio: fecha_inicio,
                    fecha_fin: fecha_fin,
                    caja_cod: caja_codigo
                },
                type: models.sequelize.QueryTypes.SELECT
            })
            .then(resp => {
                res.json(resp);
            })
            .catch(err => {
                logger.log("error", { ubicacion: filename, token: token, message : err.message });
                res.status(409).send(err);
                console.log(err)
            });
		})
	})  	
}

exports.listaDetalleOficina = (req, res) => {
	var logger = req.app.get("winston");
	var redis = req.app.get("redis");
	const token = req.header("Authorization").split(" ")[1];
	utils.decodeToken(token, tokenDecodificado => {
		//OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, async(err, usuario) => {
			usuario = JSON.parse(usuario);
			var caja_codigo1 = req.body.caja_cod;
			var opcion = "*";
			const fechai = req.body.fecha_inicio;
            const fechaf = req.body.fecha_final;
            let caja_nombre = "";
            let nombre= "";
            
            const caja = await models.caja.findOne({
                 where: {
                    caja_codigo: caja_codigo1
                }
            });
            nombre = caja.caja_nombre;
            caja_nombre = caja.caja_nombre.replace(/ /g, "_");

            models.sequelize
            .query(`SELECT * from giros('${caja_codigo1}','${opcion}', '${fechai}', '${fechaf}')`, {
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
                    arrValores[7] === 2
                        ? "#c0ffbd"
                        : arrValores[7] === 1
                        ? "#fff9bd"
                        : arrValores[7] === 3
                        ? "#a9a9a9"
                        : arrValores[7] === 4
                        ? "#ffbdbd"
                        : null
                };
                arrValores[2] = {
                    text: arrValores[2],
                    noWrap: true,
                    alignment: "left"
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
                    text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores[5]),
                    noWrap: true,
                    alignment: "right"
                };
                 arrValores[6] = {
                    text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores[6]),
                    noWrap: true,
                    alignment: "right"
                };
                arrValores.splice(7)
                return arrValores;
                });

                models.sequelize
                .query(`SELECT * from orden_pago('${caja_codigo1}','${opcion}', '${fechai}', '${fechaf}')`, {
                    type: models.sequelize.QueryTypes.SELECT
                })
                .then(lista2 => {
                    var sumS1=0.00;
                    var sumD1=0.00;
                    var sumS=0.00;
                    var sumD=0.00;
                    var sumIngS=0.00;
                    var sumIngD=0.00;
                    var sumEgS=0.00;
                    var sumEgD=0.00;
                    var SersumIngS=0.00;						
					var SersumIngD=0.00;
					var SersumEgS=0.00;
                    var SersumEgD=0.00;
                    
                    var ops2 = lista2.map(function(item) {
                    let arrValores2 = Object.values(item);
                    arrValores2[0] = {
                        text: arrValores2[0],
                        noWrap: true,
                        alignment: "right"
                    };
                    arrValores2[1] = {
                        text: arrValores2[1],
                        noWrap: true,
                        fillColor:
                        arrValores2[7] === 2
                            ? "#c0ffbd"
                            : arrValores2[7] === 1
                            ? "#fff9bd"
                            : arrValores[7] === 3
                            ? "#a9a9a9"
                            : arrValores2[7] === 4
                            ? "#ffbdbd"
                            : null
                    };
                    arrValores2[2] = {
                        text: arrValores2[2],
                        noWrap: true,
                        alignment: "right"
                    };
                    arrValores2[3] = {
                        text: arrValores2[3],
                        noWrap: false
                    };
                    arrValores2[4] = {
                        text: arrValores2[4],
                        noWrap: false
                    };
                    arrValores2[5] = {
                        text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores2[5]),
                        noWrap: true,
                        alignment: "right"
                    };
                    arrValores2[6] = {
                        text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores2[6]),
                        noWrap: true,
                        alignment: "right"
                    };
                    arrValores2.splice(7)
                    //arrValores2.pop();
                    return arrValores2;
                    });
                    for(var i=0;i<lista.length;i++){
                        sumS1=sumS1+ parseFloat(lista[i].importe_soles);						
                        sumD1=sumD1+ parseFloat(lista[i].importe_dolares);
                    }

                    for(var i=0;i<lista2.length;i++){
                        sumS=sumS+ parseFloat(lista2[i].importe_soles);						
                        sumD=sumD+ parseFloat(lista2[i].importe_dolares);
                    }
                    models.sequelize
                    .query(`SELECT * from recibos2('${caja_codigo1}','${opcion}', '${fechai}', '${fechaf}')`, {
                        type: models.sequelize.QueryTypes.SELECT
                    })
                    .then(lista3 => {
                        var ops3 = lista3.map(function(item) {
                        let arrValores3 = Object.values(item);
                        arrValores3[0] = {
                            text: arrValores3[0],
                            noWrap: true,
                            alignment: "right"
                        };
                        arrValores3[1] = {
                            text: arrValores3[1]+arrValores3[2],
                            noWrap: false
                        };
                        arrValores3[2] = {
                            text: arrValores3[3],
                            noWrap: false
                        };
                        arrValores3[3] = {
                            text: arrValores3[4],
                            noWrap: false
                        };
                        arrValores3[4] = {
                            text: arrValores3[5],
                            noWrap: false
                        };
                        //-----
                        arrValores3[5] = {
                            text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores3[6]),
                            noWrap: true,
                            alignment: "right"
                        };
                        arrValores3[6] = {
                            text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores3[7]),
                            noWrap: true,
                            alignment: "right"
                        };
                        arrValores3[7] = {
                            text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores3[8]),
                            noWrap: true,
                            alignment: "right"
                        };                            
                        arrValores3[8] = {
                            text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores3[9]),
                            noWrap: true,
                            alignment: "right"
                        };
                        arrValores3.splice(9)
                        return arrValores3;
                        });

                        for(var i=0;i<lista3.length;i++){
                            sumIngS=sumIngS+ parseFloat(lista3[i].moneda1_ingre);						
                            sumIngD=sumIngD+ parseFloat(lista3[i].moneda2_ingre);
                            sumEgS=sumEgS+ parseFloat(lista3[i].moneda1_egre);
                            sumEgD=sumEgD+ parseFloat(lista3[i].moneda2_egre);
                        }

                        models.sequelize
						.query(`SELECT * from servicios_caja('${caja_codigo1}', '${fechai}', '${fechaf}')`, {
							type: models.sequelize.QueryTypes.SELECT
						})
						.then(lista4 => {
							var ops4 = lista4.map(function(item) {
							let arrValores4 = Object.values(item);
							arrValores4[0] = {
								text: arrValores4[0],
								noWrap: true,
								alignment: "right"
							};
							arrValores4[1] = {
								text: arrValores4[1]+arrValores4[2],
								noWrap: false
							};
							arrValores4[2] = {
								text: arrValores4[3],
								noWrap: false
							};
							arrValores4[3] = {
								text: arrValores4[4],
								noWrap: false
							};
							arrValores4[4] = {
								text: arrValores4[5],
								noWrap: false
							};
							//-----
							arrValores4[5] = {
								text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores4[6]),
								noWrap: true,
								alignment: "right"
							};
							arrValores4[6] = {
								text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores4[7]),
								noWrap: true,
								alignment: "right"
							};
							arrValores4[7] = {
								text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores4[8]),
								noWrap: true,
								alignment: "right"
							};
							arrValores4[8] = {
								text: Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(arrValores4[9]),
								noWrap: true,
								alignment: "right"
							};
							arrValores4.splice(9);
							return arrValores4;
							});

							for(var i=0;i<lista4.length;i++){
								SersumIngS=SersumIngS+ parseFloat(lista4[i].moneda1_ingre);						
								SersumIngD=SersumIngD+ parseFloat(lista4[i].moneda2_ingre);
								SersumEgS=SersumEgS+ parseFloat(lista4[i].moneda1_egre);
								SersumEgD=SersumEgD+ parseFloat(lista4[i].moneda2_egre);
							}

                            models.sequelize
                            .query(`SELECT * from saldos_caja2('${fechai}','${fechaf}','${caja_codigo1}')`, {
                                type: models.sequelize.QueryTypes.SELECT
                            })
                            .then(listasaldos => {		
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
                                pageMargins: [20, 40, 20, 40],
                                content: [
                                    {
                                    text: "Detalle Caja",
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
                                        columns: [
                                            {
                                            // auto-sized columns have their widths based on their content
                                            width: 120,
                                            text: 'SALDO ANTERIOR :',
                                            style: "saldos"
                                            },
                                            {
                                            // star-sized columns fill the remaining space
                                            // if there's more than one star-column, available width is divided equally
                                            width: 80,
                                            text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(listasaldos[0].soles_anterior)}`,
                                            style: "monto"
                                            },
                                            {
                                            // fixed width
                                            width: 'auto',
                                            text: 'SOLES',
                                            style: "saldos"
                                            },
                                            {
                                            // star-sized columns fill the remaining space
                                            // if there's more than one star-column, available width is divided equally
                                            width: 80,
                                            text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(listasaldos[0].dolares_anterior)}`,
                                            style: "monto"
                                            },
                                            {
                                            // fixed width
                                            width: 'auto',
                                            text: 'DOLARES',
                                            style: "saldos"
                                            }
                                        ]
                                    },
                                    {
                                        columns: [
                                            {
                                            // auto-sized columns have their widths based on their content
                                            width: 120,
                                            text: 'SALDO FINAL :',
                                            style: "saldos"
                                            },
                                            {
                                            // star-sized columns fill the remaining space
                                            // if there's more than one star-column, available width is divided equally
                                            width: 80,
                                            text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(listasaldos[0].soles_final)}`,
                                            style: "monto"
                                            },
                                            {
                                            // fixed width
                                            width: 'auto',
                                            text: 'SOLES',
                                            style: "saldos"
                                            },
                                            {
                                            // star-sized columns fill the remaining space
                                            // if there's more than one star-column, available width is divided equally
                                            width: 80,
                                            text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(listasaldos[0].dolares_final)}`,
                                            style: "monto"
                                            },
                                            {
                                            // fixed width
                                            width: 'auto',
                                            text: 'DOLARES',
                                            style: "saldos"
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
                                                }
                                            ]
                                            ]
                                        }
                                        },
                                        {
                                            text: "Giros Recaudados",
                                            style: "subtitulo"
                                        },
                                        {
                                        style: "tabla",
                                        table: {
                                            // headers are automatically repeated if the table spans over multiple pages
                                            // you can declare how many rows should be treated as headers
                                            headerRows: 1,
                                            // ANCHO DE  CADA COLUMNA
                                            widths: ["auto","auto","auto", "*", "*", "auto", "auto"],
                                            body: [
                                            ["Nro","Destino", "Nro Boleta", "Beneficiario", "Solicitante", "Importe S/.", "Importe $"],
                                            ...ops,
                                            ["","","","","TOTAL",
                                                {text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumS1)}`,
                                                    noWrap: true,
                                                    alignment: "right"},
                                                {text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumD1)}`,
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
                                        //------
                                        {
                                            text: "Giros Pagados",
                                            style: "subtitulo"
                                        },
                                        {
                                            style: "tabla",
                                            table: {
                                                // headers are automatically repeated if the table spans over multiple pages
                                                // you can declare how many rows should be treated as headers
                                                headerRows: 1,
                                                // ANCHO DE  CADA COLUMNA
                                                widths: ["auto","auto","auto", "*", "*", "auto", "auto"],
                                                body: [
                                                ["Nro","Destino", "Nro Boleta", "Beneficiario", "Solicitante", "Importe S/.", "Importe $"],
                                                ...ops2,
                                                ["","","","","TOTAL",
                                                    {text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumS)}`,
                                                        noWrap: true,
                                                        alignment: "right"},
                                                    {text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumD)}`,
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
                                            text: "Recibos Internos",
                                            style: "subtitulo"
                                        },
                                        {
                                            style: "tabla",
                                            table: {
                                                // headers are automatically repeated if the table spans over multiple pages
                                                // you can declare how many rows should be treated as headers
                                                headerRows: 2,
                                                // ANCHO DE  CADA COLUMNA
                                                widths: ["auto","auto","auto","*", "*", "auto", "auto", "auto","auto"],
                                                body: [
                                                [	"",						
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
                                                ["Nro","Documento","Oficina Origen", "Concepto", "Razón Social", "Ingreso", "Egreso", "Ingreso","Egreso"],
                                                ...ops3,
                                                ["","","","","TOTAL",
                                                    {text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumIngS)}`,
                                                        noWrap: true,
                                                        alignment: "right"},
                                                    {text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumEgS)}`,
                                                        noWrap: true,
                                                        alignment: "right"},
                                                    {text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumIngD)}`,
                                                        noWrap: true,
                                                        alignment: "right"},
                                                    {text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(sumEgD)}`,
                                                        noWrap: true,
                                                        alignment: "right"},
                                                    ]
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
                                        },
                                        {
                                            text: "Servicios",
                                            style: "subtitulo"
                                        },
                                        {
                                            style: "tabla",
                                            table: {
                                                // headers are automatically repeated if the table spans over multiple pages
                                                // you can declare how many rows should be treated as headers
                                                headerRows: 2,
                                                // ANCHO DE  CADA COLUMNA
                                                widths: ["auto","auto","auto","*", "*", "auto", "auto", "auto","auto"],
                                                body: [
                                                [	"",						
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
                                                ["Nro","Documento","Oficina Origen","Entidad", "Razón Social", "Ingreso", "Egreso", "Ingreso","Egreso"],
                                                ...ops4,
                                                ["","","","","TOTAL",
                                                    {text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(SersumIngS)}`,
                                                        noWrap: true,
                                                        alignment: "right"},
                                                    {text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(SersumEgS)}`,
                                                        noWrap: true,
                                                        alignment: "right"},
                                                    {text: `${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(SersumIngD)}`,
                                                        noWrap: true,
                                                        alignment: "right"},
                                                    {text:`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2}).format(SersumEgD)}`,
                                                        noWrap: true,
                                                        alignment: "right"},
                                                    ]
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
                                        //------

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
                                    res.setHeader("Content-Disposition", `attachment; filename=DetalleCaja_${caja_codigo1}_${moment().locale("es").format("DD-MM-YYYY_HH'mm")}.pdf`);
                                    res.send(result);
                                    });
                                    pdfDoc.end();
                                })
                            })
                        })

                    })				
                    
                })
                .catch(err => {
                    logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
                    res.status(409).send("Error al generar");
                    console.log(err)
                });	
	    })
	})
};

exports.detalle_caja_porOficina = (req, res) => {
	var logger = req.app.get("winston");
	var redis = req.app.get("redis");
	const token = req.header("Authorization").split(" ")[1];

	utils.decodeToken(token, tokenDecodificado => {
		//OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, (err, usuario) => {
			usuario = JSON.parse(usuario);
			var caja_codigo = req.body.caja_codigo;
			var opcion = req.body.opcion;
			var fecha_inicio = req.body.fecha_inicio;
			var fecha_final = req.body.fecha_final;

			models.sequelize
			.query(
				`select * from giros('${caja_codigo}','','${fecha_inicio}','${fecha_final}');`, {
					type: models.sequelize.QueryTypes.SELECT
				}
			)
			.then(lista1 => {
				models.sequelize
					.query(
						`select * from orden_pago('${caja_codigo}','','${fecha_inicio}','${fecha_final}');`, {
							type: models.sequelize.QueryTypes.SELECT
						}
					)
						.then(lista2 => {
							models.sequelize
								.query(
									`select * from recibos2('${caja_codigo}','','${fecha_inicio}','${fecha_final}');`, {
										type: models.sequelize.QueryTypes.SELECT
									}
								)
								.then(lista3 => {
                                    models.sequelize
										.query(
											`select * from servicios_caja('` + caja_codigo + `','` + fecha_inicio + `','` + fecha_final + `');`, {
											type: models.sequelize.QueryTypes.SELECT
										})
										.then(lista4 => {
                                            var lista = {
                                                transferencias: lista1,
                                                ordenesPago: lista2,
                                                recibos: lista3,
                                                servicios: lista4
                                            };
                                            res.json(lista);
                                        })
                                        .catch(err => {
                                            logger.log("error", { ubicacion: filename, token: token, err });
                                            res.json({
                                                error: err.errors
                                            });
                                        })
								})
								.catch(err => {
									logger.log("error", { ubicacion: filename, token: token, err });
									res.json({
										error: err.errors
									});
								})
							})
						.catch(err => {
							logger.log("error", { ubicacion: filename, token: token, err });
							res.json({
								error: err.errors
							});
						})
						.catch(err => {
							logger.log("error", { ubicacion: filename, token: token, err });
							res.json({
								error: err.errors
							});
						});
					})
					.catch(err => {
						logger.log("error", { ubicacion: filename, token: token, err });
						res.json({
							error: err.errors
						});
					});
			})
		})
};

exports.listarPor = (req, res) => {
    var logger = req.app.get("winston");
    var redis = req.app.get("redis");
    const token = req.header("Authorization").split(" ")[1];

    utils.decodeToken(token, tokenDecodificado => {
		//OBTENER DATOS DEL USUARIO DESDE REDIS
		redis.get(tokenDecodificado.id, (err, usuario) => {
			usuario = JSON.parse(usuario);
            models.caja.findOne({
                attributes:["oficina_codigo"],
                where: {
                    caja_codigo: usuario.caja_codigo
                }
            })
            .then(resp => {
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
                    oficina_codigo: resp.oficina_codigo
                    }
                })
                .then(lista => {
                    res.json(lista);
                })
                .catch(err => {
                    logger.log("error", { ubicacion: filename, token: token, message: { mensaje: err.message, tracestack: err.stack } });
                    res.status(412).send();
                });
            })
            .catch(err => {
                logger.log("error", { ubicacion: filename, token: token, err });
                res.json({
                    error: err.errors
                });
            });
        })
    })
};