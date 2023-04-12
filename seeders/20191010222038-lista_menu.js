'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(
			"lista_menu",
			[
				{
					menu_codigo: "mt7",
					perfil_codigo: 1,
					nivel_acceso: 6,
					createdAt: "2019-01-01",
					updatedAt: "2019-01-01"
				}
			],
			{}
		);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("lista_menu", null, {});
  }
};
