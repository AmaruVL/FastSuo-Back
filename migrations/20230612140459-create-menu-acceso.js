/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('menu_acceso', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      menu_codigo: {
        type: Sequelize.STRING,
      },
      menu_etiqueta: {
        type: Sequelize.STRING,
      },
      descripcion: {
        type: Sequelize.STRING,
      },
      nivel: {
        type: Sequelize.SMALLINT,
      },
      modulo: {
        type: Sequelize.STRING,
      },
      tipo_modulo: {
        type: Sequelize.STRING,
      },
      imagen: {
        type: Sequelize.STRING,
      },
      ambito_acceso: {
        type: Sequelize.STRING,
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
