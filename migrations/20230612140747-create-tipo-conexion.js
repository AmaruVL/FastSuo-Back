/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tipo_conexion', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      usuario: {
        type: Sequelize.STRING,
      },
      fecha_trabajo: {
        type: Sequelize.DATEONLY,
      },
      fecha_hora_apertura: {
        type: Sequelize.DATE,
      },
      estado_caja: {
        type: Sequelize.STRING,
      },
      tipo_conexion_sistema_op: {
        type: Sequelize.STRING,
      },
      tipo_conexion_navegador: {
        type: Sequelize.STRING,
      },
      tipo_dispositivo: {
        type: Sequelize.STRING,
      },
      pc_movil_marca: {
        type: Sequelize.STRING,
      },
      pc_movil_modelo: {
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
    await queryInterface.dropTable('tipo_conexion');
  },
};
