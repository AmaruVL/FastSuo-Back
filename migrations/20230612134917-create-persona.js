/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('personas', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      dni: {
        type: Sequelize.STRING,
      },
      tipo_persona: {
        type: Sequelize.STRING,
      },
      nombres: {
        type: Sequelize.STRING,
      },
      ap_paterno: {
        type: Sequelize.STRING,
      },
      ap_materno: {
        type: Sequelize.STRING,
      },
      razon_social: {
        type: Sequelize.STRING,
      },
      sexo: {
        type: Sequelize.BOOLEAN,
      },
      fecha_nacimiento: {
        type: Sequelize.DATEONLY,
      },
      nro_fijo: {
        type: Sequelize.STRING,
      },
      nro_movil: {
        type: Sequelize.STRING,
      },
      correo: {
        type: Sequelize.STRING,
      },
      direccion: {
        type: Sequelize.STRING,
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
    await queryInterface.dropTable('personas');
  },
};
