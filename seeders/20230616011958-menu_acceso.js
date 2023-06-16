/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('menu_acceso', [
      {
        menu_codigo: 'm1',
        menu_etiqueta: 'Caja',
        descripcion: 'item menu principal',
        nivel: 1,
        modulo: 'caja',
        tipo_modulo: 'caja',
        imagen: '/images/menu/caja.svg',
        ambito_acceso: 'mixto',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'm2',
        menu_etiqueta: 'Reportes',
        descripcion: 'item menu principal',
        nivel: 1,
        modulo: 'reportes',
        tipo_modulo: 'reportes',
        imagen: '/images/menu/reportes.svg',
        ambito_acceso: 'mixto',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'm3',
        menu_etiqueta: 'Mantenimientos',
        descripcion: 'item menu principal',
        nivel: 1,
        modulo: 'mantenimiento',
        tipo_modulo: 'mantenimiento',
        imagen: '/images/menu/mantenimientos.svg',
        ambito_acceso: 'mixto',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'm4',
        menu_etiqueta: 'Configuracion',
        descripcion: 'item menu principal',
        nivel: 1,
        modulo: 'configuracion',
        tipo_modulo: 'configuracion',
        imagen: '/images/menu/configuracion.svg',
        ambito_acceso: 'mixto',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt1',
        menu_etiqueta: 'Personas',
        descripcion: 'item menu mantenimientos',
        nivel: 2,
        modulo: 'mantenimiento',
        tipo_modulo: 'personas',
        imagen: '/images/mantenimiento/clientes.svg',
        ambito_acceso: 'mixto',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt2',
        menu_etiqueta: 'Cuentas sunat',
        descripcion: 'item menu mantenimientos',
        nivel: 2,
        modulo: 'mantenimiento',
        tipo_modulo: 'cuentassunat',
        imagen: '/images/mantenimiento/cuentasSunat.svg',
        ambito_acceso: 'mixto',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt3',
        menu_etiqueta: 'Entidades financieras',
        descripcion: 'item menu mantenimientos',
        nivel: 2,
        modulo: 'mantenimiento',
        tipo_modulo: 'entidadesfinancieras',
        imagen: '/images/mantenimiento/entidadesFinancieras.svg',
        ambito_acceso: 'mixto',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt4',
        menu_etiqueta: 'Empresas',
        descripcion: 'item menu mantenimientos',
        nivel: 2,
        modulo: 'mantenimiento',
        tipo_modulo: 'empresas',
        imagen: '/images/mantenimiento/empresas.svg',
        ambito_acceso: 'mixto',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt5',
        menu_etiqueta: 'Documentos',
        descripcion: 'item menu mantenimientos',
        nivel: 2,
        modulo: 'mantenimiento',
        tipo_modulo: 'documentos',
        imagen: '/images/mantenimiento/documentos.svg',
        ambito_acceso: 'mixto',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt6',
        menu_etiqueta: 'Usuarios',
        descripcion: 'item menu mantenimientos',
        nivel: 2,
        modulo: 'mantenimiento',
        tipo_modulo: 'usuarios',
        imagen: '/images/mantenimiento/usuarios.svg',
        ambito_acceso: 'mixto',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt7',
        menu_etiqueta: 'Perfiles',
        descripcion: 'item menu mantenimientos',
        nivel: 2,
        modulo: 'mantenimiento',
        tipo_modulo: 'perfiles',
        imagen: '/images/mantenimiento/perfiles.svg',
        ambito_acceso: 'mixto',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt8',
        menu_etiqueta: 'Centro Costo',
        descripcion: 'item menu mantenimientos',
        nivel: 2,
        modulo: 'mantenimiento',
        tipo_modulo: 'centrocosto',
        imagen: '/images/mantenimiento/centrocosto.svg',
        ambito_acceso: 'mixto',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt9',
        menu_etiqueta: 'Configuracion adicional',
        descripcion: 'item menu mantenimientos',
        nivel: 2,
        modulo: 'mantenimiento',
        tipo_modulo: 'configuracion',
        imagen: 'NULL',
        ambito_acceso: 'NULL',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt10',
        menu_etiqueta: 'Cuentas Corrientes',
        descripcion: 'item menu mantenientos',
        nivel: 2,
        modulo: 'mantenimiento',
        tipo_modulo: 'cuentacorriente',
        imagen: 'NULL',
        ambito_acceso: 'NULL',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt11',
        menu_etiqueta: 'Centros Poblados',
        descripcion: 'item menu mantenimientos',
        nivel: 2,
        modulo: 'mantenimiento',
        tipo_modulo: 'centrospoblados',
        imagen: '',
        ambito_acceso: 'NULL',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt12',
        menu_etiqueta: 'Comision Servicios',
        descripcion: 'item menu mantenimientos',
        nivel: 2,
        modulo: 'mantenimiento',
        tipo_modulo: 'comisionservicios',
        imagen: 'NULL',
        ambito_acceso: 'NULL',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt13',
        menu_etiqueta: 'Menu Accesos',
        descripcion: 'item menu mantenimientos',
        nivel: 2,
        modulo: 'mantenimiento',
        tipo_modulo: 'menuaccesos',
        imagen: 'NULL',
        ambito_acceso: 'mixto',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt14',
        menu_etiqueta: 'Conductores',
        descripcion: 'item menu mantenimientos',
        nivel: 2,
        modulo: 'mantenimiento',
        tipo_modulo: 'conductores',
        imagen: 'NULL',
        ambito_acceso: 'mixto',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        menu_codigo: 'mt15',
        menu_etiqueta: 'Vehiculos',
        descripcion: 'item menu mantenimientos',
        nivel: 2,
        modulo: 'mantenimiento',
        tipo_modulo: 'vehiculos',
        imagen: 'NULL',
        ambito_acceso: 'mixto',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('menu_acceso', null, {});
  },
};
