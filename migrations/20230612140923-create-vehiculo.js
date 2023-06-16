/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vehiculo', {
      id_vehiculo: {
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER,
      },
      placa: {
        allowNull: false,
        type: Sequelize.STRING(10),
      },
      marca: {
        type: Sequelize.STRING(10),
      },
      clase: {
        type: Sequelize.STRING(10),
      },
      modelo: {
        type: Sequelize.STRING(10),
      },
      color: {
        type: Sequelize.STRING(10),
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
    await queryInterface.dropTable('vehiculo');
  },
};
