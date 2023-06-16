/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cuenta_usuario', {
      usuario: {
        primaryKey: true,
        allowNull: false,
        type: Sequelize.STRING(20),
      },
      contrasena: {
        type: Sequelize.STRING(128),
      },
      usuario_nombre: {
        type: Sequelize.STRING(45),
      },
      pregunta_secreta: {
        type: Sequelize.STRING(60),
      },
      respuesta: {
        type: Sequelize.STRING(60),
      },
      contrasena_old: {
        type: Sequelize.STRING(128),
      },
      pc_sn: {
        type: Sequelize.STRING(50),
      },
      estado_registro: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      puede_editar_dt: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      modo_conexion: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      tipo_arqueo: {
        type: Sequelize.STRING(30),
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
    await queryInterface.dropTable('cuenta_usuario');
  },
};
