/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('menu_acceso', {
      menu_codigo: {
        allowNull: false,
        type: Sequelize.STRING(6),
        primaryKey: true,
      },
      menu_etiqueta: {
        allowNull: false,
        type: Sequelize.STRING(20),
      },
      descripcion: {
        allowNull: false,
        type: Sequelize.STRING(20),
      },
      nivel: {
        allowNull: false,
        type: Sequelize.SMALLINT,
      },
      modulo: {
        type: Sequelize.STRING(20),
      },
      tipo_modulo: {
        type: Sequelize.STRING(20),
      },
      imagen: {
        type: Sequelize.STRING(30),
      },
      ambito_acceso: {
        type: Sequelize.STRING(15),
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('menu_acceso');
  },
};
