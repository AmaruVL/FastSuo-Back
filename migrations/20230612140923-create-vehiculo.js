/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vehiculo', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      id_vehiculo: {
        type: Sequelize.INTEGER,
      },
      placa: {
        type: Sequelize.STRING,
      },
      marca: {
        type: Sequelize.STRING,
      },
      clase: {
        type: Sequelize.STRING,
      },
      modelo: {
        type: Sequelize.STRING,
      },
      color: {
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
    await queryInterface.dropTable('vehiculo');
  },
};
