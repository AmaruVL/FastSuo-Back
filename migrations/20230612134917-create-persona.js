/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('persona', {
      id_persona: {
        allowNull: false,
        // autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
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
    await queryInterface.dropTable('persona');
  },
};
