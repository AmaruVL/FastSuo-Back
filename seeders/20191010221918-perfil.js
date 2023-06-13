module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.bulkInsert(
      'perfil',
      [
        {
          perfil_codigo: 1,
          perfil_nombre: 'admin',
          descripcion: 'descripcion-admin',
          icono: [null],
          estado_registro: true,
          createdAt: '2019-01-01',
          updatedAt: '2019-01-01',
        },
      ],
      {},
    ),

  down: (queryInterface, Sequelize) => queryInterface.bulkDelete('perfil', null, {}),
};
