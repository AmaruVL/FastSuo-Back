/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('conductor', [
      {
        nro_brevete: '8321T',
        nro_licencia_correlativo: '',
        estado: 'Activo',
        fecha_expedicion: '2023-01-01',
        fecha_revalidacion: '2023-01-01',
        restricciones: '',
        created_at: new Date(),
        updated_at: new Date(),
        id_persona: '73232321',
      },
      {
        nro_brevete: '3421T',
        nro_licencia_correlativo: '',
        estado: 'Activo',
        fecha_expedicion: '2023-01-01',
        fecha_revalidacion: '2023-01-01',
        restricciones: '',
        created_at: new Date(),
        updated_at: new Date(),
        id_persona: '73288323',
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('conductor', null);
  },
};
