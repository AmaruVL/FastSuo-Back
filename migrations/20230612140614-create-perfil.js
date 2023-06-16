/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('perfil', {
      perfil_codigo: {
        allowNull: false,
        type: Sequelize.SMALLINT,
        primaryKey: true,
      },
      perfil_nombre: {
        type: Sequelize.STRING(100),
      },
      descripcion: {
        type: Sequelize.STRING(200),
      },
      icono: {
        type: Sequelize.STRING(20),
      },
      estado_registro: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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
    await queryInterface.dropTable('perfil');
  },
};
