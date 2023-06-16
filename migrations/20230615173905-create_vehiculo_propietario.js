/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vehiculo_propietario', {
      id_persona: {
        primaryKey: true,
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      id_vehiculo: {
        primaryKey: true,
        allowNull: false,
        type: Sequelize.INTEGER,
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
    await queryInterface.dropTable('vehiculo_propietario');
  },
};
