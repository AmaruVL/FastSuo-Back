/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('lista_menu', [
      {
        menu_codigo: 'mt1',
        perfil_codigo: 1,
        nivel_acceso: 6,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt2',
        perfil_codigo: 1,
        nivel_acceso: 6,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt3',
        perfil_codigo: 1,
        nivel_acceso: 6,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt4',
        perfil_codigo: 1,
        nivel_acceso: 6,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt5',
        perfil_codigo: 1,
        nivel_acceso: 6,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt6',
        perfil_codigo: 1,
        nivel_acceso: 6,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt7',
        perfil_codigo: 1,
        nivel_acceso: 6,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt8',
        perfil_codigo: 1,
        nivel_acceso: 6,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt9',
        perfil_codigo: 1,
        nivel_acceso: 6,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt10',
        perfil_codigo: 1,
        nivel_acceso: 6,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt11',
        perfil_codigo: 1,
        nivel_acceso: 6,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt12',
        perfil_codigo: 1,
        nivel_acceso: 6,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt13',
        perfil_codigo: 1,
        nivel_acceso: 6,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt14',
        perfil_codigo: 1,
        nivel_acceso: 6,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt15',
        perfil_codigo: 1,
        nivel_acceso: 6,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('lista_menu', null);
  },
};
