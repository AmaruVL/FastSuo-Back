var bcrypt = require('bcryptjs');
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(
      'cuenta_usuario',
      [
        {
          usuario: 'admin',
          contrasena: bcrypt.hashSync('admin', 8),
          usuario_nombre: 'admin',
          pregunta_secreta: 'fruta favorita',
          respuesta: 'pera',
          contrasena_old: '',
          estado_registro: true,
          perfil_codigo: 1,
          createdAt: '2019-01-01',
          updatedAt: '2019-01-01',
          estado_registro: false,
        },
      ],
      {},
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('cuenta_usuario', null, {});
  },
};
