/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tipo_conexion', {
      usuario: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(20),
      },
      fecha_trabajo: {
        allowNull: false,
        type: Sequelize.DATEONLY,
      },
      fecha_hora_apertura: {
        type: Sequelize.DATE,
      },
      estado_caja: {
        type: Sequelize.STRING(10),
      },
      tipo_conexion_sistema_op: {
        type: Sequelize.STRING(255),
      },
      tipo_conexion_navegador: {
        type: Sequelize.STRING(255),
      },
      tipo_dispositivo: {
        type: Sequelize.STRING(250),
      },
      pc_movil_marca: {
        type: Sequelize.STRING(250),
      },
      pc_movil_modelo: {
        type: Sequelize.STRING(250),
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
    await queryInterface.dropTable('tipo_conexion');
  },
};
