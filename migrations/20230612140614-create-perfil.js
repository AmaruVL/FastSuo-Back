/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('perfils', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      perfil_codigo: {
        type: Sequelize.SMALLINT,
      },
      perfil_nombre: {
        type: Sequelize.STRING,
      },
      descripcion: {
        type: Sequelize.STRING,
      },
      icono: {
        type: Sequelize.STRING,
      },
      estado_registro: {
        type: Sequelize.BOOLEAN,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('perfils');
  },
};
