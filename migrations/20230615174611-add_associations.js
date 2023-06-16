/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // params: nombreTabla, nombreColumna, opciones
    // BELONGS TO
    await queryInterface.addColumn('conductor', 'id_persona', {
      type: Sequelize.INTEGER,
      references: {
        model: 'persona',
        key: 'id_persona',
      },
    });
    await queryInterface.addColumn('cuenta_usuario', 'perfil_codigo', {
      type: Sequelize.SMALLINT,
      references: {
        model: 'perfil',
        key: 'perfil_codigo',
      },
    });
    await queryInterface.addColumn('tipo_conexion', 'id_cuenta_usuario', {
      type: Sequelize.STRING(20),
      references: {
        model: 'cuenta_usuario',
        key: 'usuario',
      },
    });
    // BELOGNS TO MANY
    await queryInterface.changeColumn('vehiculo_propietario', 'id_persona', {
      primaryKey: true,
      allowNull: false,
      type: Sequelize.INTEGER,
      references: {
        model: 'persona',
        key: 'id_persona',
      },
    });
    await queryInterface.changeColumn('vehiculo_propietario', 'id_vehiculo', {
      primaryKey: true,
      allowNull: false,
      type: Sequelize.INTEGER,
      references: {
        model: 'vehiculo',
        key: 'id_vehiculo',
      },
    });
    // TODO: ADD constraint, remove BelongToMany
    await queryInterface.changeColumn('lista_menu', 'menu_codigo', {
      primaryKey: true,
      allowNull: false,
      type: Sequelize.STRING(6),
      references: {
        model: 'menu_acceso',
        key: 'menu_codigo',
      },
    });
    await queryInterface.changeColumn('lista_menu', 'perfil_codigo', {
      primaryKey: true,
      allowNull: false,
      type: Sequelize.SMALLINT,
      references: {
        model: 'perfil',
        key: 'perfil_codigo',
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('conductor', 'id_persona');
    await queryInterface.removeColumn('cuenta_usuario', 'perfil_codigo');
    await queryInterface.removeColumn('tipo_conexion', 'id_cuenta_usuario');
    await queryInterface.changeColumn('vehiculo_propietario', 'id_persona', {
      primaryKey: true,
      allowNull: false,
      type: Sequelize.INTEGER,
    });
    await queryInterface.changeColumn('vehiculo_propietario', 'id_vehiculo', {
      primaryKey: true,
      allowNull: false,
      type: Sequelize.INTEGER,
    });
    await queryInterface.changeColumn('lista_menu', 'menu_codigo', {
      primaryKey: true,
      allowNull: false,
      type: Sequelize.STRING(6),
    });
    await queryInterface.changeColumn('lista_menu', 'perfil_codigo', {
      primaryKey: true,
      allowNull: false,
      type: Sequelize.SMALLINT,
    });
  },
};
