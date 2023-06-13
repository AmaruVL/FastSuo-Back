

module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.bulkInsert(
      "configuracion",
      [
        {
          clave: "Comision_Servicios",
          valor: "1"
        },
        {
          clave: "DT_Intercambio",
          valor: "0"
        },
        {
          clave: "Oficina_Destino_Servicios",
          valor: ""
        },
        {
          clave: "Oficina_Bancos",
          valor: ""
        },
        {
          clave: "Cantidad_Ceros_Nro_Op",
          valor: "6"
        },
        {
          clave: "Monto_Maximo_Pago_Autorizacion",
          valor: "1000"
        },
        {
          clave: "Tiempo_Maximo_Pago_Autorizacion_Dias",
          valor: "30"
        }
      ],
      {}
    ),

  down: (queryInterface, Sequelize) => queryInterface.bulkDelete("configuracion", null, {})
};
