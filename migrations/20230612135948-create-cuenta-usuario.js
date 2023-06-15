/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cuenta_usuario', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      usuario: {
        type: Sequelize.STRING,
      },
      contrasena: {
        type: Sequelize.STRING,
      },
      usuario_nombre: {
        type: Sequelize.STRING,
      },
      pregunta_secreta: {
        type: Sequelize.STRING,
      },
      respuesta: {
        type: Sequelize.STRING,
      },
      contrasena_old: {
        type: Sequelize.STRING,
      },
      pc_sn: {
        type: Sequelize.STRING,
      },
      estado_registro: {
        type: Sequelize.BOOLEAN,
      },
      perfil_codigo: {
        type: Sequelize.SMALLINT,
      },
      puede_editar_DT: {
        type: Sequelize.BOOLEAN,
      },
      modo_conexion: {
        type: Sequelize.INTEGER,
      },
      tipo_arqueo: {
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
    await queryInterface.dropTable('cuenta_usuario');
  },
};
