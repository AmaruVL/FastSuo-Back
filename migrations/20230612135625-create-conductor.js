/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('conductor', {
      nro_brevete: {
        primaryKey: true,
        allowNull: false,
        type: Sequelize.STRING(10),
      },
      nro_licencia_correlativo: {
        type: Sequelize.STRING(100),
      },
      estado: {
        type: Sequelize.STRING(100),
      },
      fecha_expedicion: {
        type: Sequelize.DATE,
      },
      fecha_revalidacion: {
        type: Sequelize.DATE,
      },
      restricciones: {
        allowNull: true,
        type: Sequelize.STRING(100),
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
    await queryInterface.dropTable('conductor');
  },
};
