/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('vehiculo', [
      {
        placa: 'X3T-879',
        marca: 'HYUNDAI',
        clase: '',
        modelo: '',
        color: 'AZUL BEIGE',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        placa: 'XYT-214',
        marca: 'TOYOTA',
        clase: '',
        modelo: '',
        color: 'ROJO',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('vehiculo', null);
  },
};
