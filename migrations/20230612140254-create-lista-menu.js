/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('lista_menu', {
      menu_codigo: {
        primaryKey: true,
        allowNull: false,
        type: Sequelize.STRING(6),
      },
      perfil_codigo: {
        primaryKey: true,
        allowNull: false,
        type: Sequelize.SMALLINT,
      },
      nivel_acceso: {
        allowNull: false,
        type: Sequelize.SMALLINT,
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
    await queryInterface.dropTable('lista_menu');
  },
};
