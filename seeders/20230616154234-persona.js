/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('persona', [
      {
        id_persona: '73232323',
        tipo_persona: 'Natural',
        nombres: 'JOEL',
        ap_paterno: 'RODRIGUEZ',
        ap_materno: 'HUAMAN',
        razon_social: 'JOEL RODRIGUEZ HUAMAN',
        sexo: 0,
        fecha_nacimiento: '1985-11-23',
        nro_fijo: null,
        nro_movil: null,
        correo: null,
        direccion: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id_persona: '73232321',
        tipo_persona: 'Natural',
        nombres: 'LIVIA',
        ap_paterno: 'MENDOZA',
        ap_materno: 'GUTIERREZ',
        razon_social: 'LIVIA MENDOZA GUTIERREZ',
        sexo: 1,
        fecha_nacimiento: '1993-03-14',
        nro_fijo: null,
        nro_movil: null,
        correo: null,
        direccion: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id_persona: '73288323',
        tipo_persona: 'Natural',
        nombres: 'JUAN MARIO',
        ap_paterno: 'FERNANDEZ',
        ap_materno: 'SOLAR',
        razon_social: 'JUAN MARIO FERNANDEZ SOLAR',
        sexo: 0,
        fecha_nacimiento: '1995-11-23',
        nro_fijo: null,
        nro_movil: null,
        correo: null,
        direccion: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('persona', null);
  },
};
