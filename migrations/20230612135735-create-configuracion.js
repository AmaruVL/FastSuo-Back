/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('configuracion', {
      clave: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(50),
      },
      valor: {
        allowNull: false,
        type: Sequelize.STRING(200),
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
    await queryInterface.dropTable('configuracion');
  },
};
