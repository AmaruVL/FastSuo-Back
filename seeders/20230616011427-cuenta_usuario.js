/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('cuenta_usuario', [
      {
        usuario: 'admin',
        contrasena: '$2a$08$YNAVu9zO5jGm8yWw5clGpOx.F9hcnbYJBRAJJyZXopkAEArFThRnC',
        usuario_nombre: 'admin',
        pregunta_secreta: 'PreguntaA',
        respuesta: 'admin',
        contrasena_old: 'jadmin',
        estado_registro: 'True',
        perfil_codigo: 1,
        puede_editar_dt: false,
        pc_sn: 'NBQ2L11003805F61F07601',
        modo_conexion: 4,
        tipo_arqueo: 'DETALLADO',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        usuario: 'jessi.bustamante',
        contrasena: '$2a$08$d8Njmg/vgbA5dSW2fwFf5uhvVmBRwZUb3xROVP0UFG.cR79wQIo1u',
        usuario_nombre: 'Jessi C. Bustamante Rdz',
        pregunta_secreta: 'PreguntaA',
        respuesta: 'mango',
        contrasena_old: 'libertad$2020',
        estado_registro: 'True',
        perfil_codigo: 1,
        puede_editar_dt: true,
        pc_sn: null,
        modo_conexion: 4,
        tipo_arqueo: 'VER SALDOS',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('cuenta_usuario', null);
  },
};
