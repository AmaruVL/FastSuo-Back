/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('perfil', [
      {
        perfil_codigo: 1,
        perfil_nombre: 'admin',
        descripcion: 'admin',
        icono: '',
        estado_registro: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('perfil', null);
  },
};
