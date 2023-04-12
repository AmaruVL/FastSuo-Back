"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:*/
    return queryInterface.bulkInsert(
      "moneda_denominacion",
      [
        {
          tipo_moneda: "SOL",
          nombre: "10 Centimos",
          valor: 0.1
        },
        {
          tipo_moneda: "SOL",
          nombre: "20 Centimos",
          valor: 0.2
        },
        {
          tipo_moneda: "SOL",
          nombre: "50 Centimos",
          valor: 0.5
        },
        {
          tipo_moneda: "SOL",
          nombre: "1 Sol",
          valor: 1.0
        },
        {
          tipo_moneda: "SOL",
          nombre: "2 Soles",
          valor: 2.0
        },
        {
          tipo_moneda: "SOL",
          nombre: "5 Soles",
          valor: 5.0
        },
        {
          tipo_moneda: "SOL",
          nombre: "20 Soles",
          valor: 20.0
        },
        {
          tipo_moneda: "SOL",
          nombre: "50 Soles",
          valor: 50.0
        },
        {
          tipo_moneda: "SOL",
          nombre: "100 Soles",
          valor: 100.0
        },
        {
          tipo_moneda: "SOL",
          nombre: "200 Soles",
          valor: 200.0
        },
        {
          tipo_moneda: "DOLAR",
          nombre: "1 Dolar",
          valor: 1.0
        },
        {
          tipo_moneda: "DOLAR",
          nombre: "2 Dolares",
          valor: 2.0
        },
        {
          tipo_moneda: "DOLAR",
          nombre: "5 Dolares",
          valor: 5.0
        },
        {
          tipo_moneda: "DOLAR",
          nombre: "10 Dolares",
          valor: 10.0
        },
        {
          tipo_moneda: "DOLAR",
          nombre: "20 Dolares",
          valor: 20.0
        },
        {
          tipo_moneda: "DOLAR",
          nombre: "50 Dolares",
          valor: 50.0
        },
        {
          tipo_moneda: "DOLAR",
          nombre: "100 Dolares",
          valor: 100.0
        }
      ],
      {}
    );
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('People', null, {});
    */
  }
};
