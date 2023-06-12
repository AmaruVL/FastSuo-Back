# Recaudaciones tributarias - Aplicacion Backend

## Ejecutar servidor

Si se desea ejecutar el servidor, se debe realizar los siguientes pasos:

1. Primero tener instalado [Node.js](https://nodejs.org/es) >=16.10 y el gestor de paquetes [Yarn](https://yarnpkg.com/getting-started/install) >=3.0.

2. Seguido, se deberá instalar las dependecias del proyecto ejecutando `yarn install` en la terminal.

3. Crear el archivo `.env` en la raíz del proyecto en base al contenido del archivo `.env.example`. Este archivo inicializa las variables de entorno que contienen las configuraciones necesarias para iniciar la aplicación. Estas variables son las siguientes:

- `DB_USERNAME`: Nombre de usuario de la base de datos
- `DB_PASSWORD`: Contraseña de la base de datos
- `DB_DATABASE`: Nombre de la base de datos
- `DB_HOST`: Dominio en donde se encuentra la base de datos
- `DB_DIALECT`: Nombre del gestor de base de datos
- `DB_LOGGING`: Opcion si se desea mostrar por consola los logs de la base de datos
- `PORT`: Puerto en el que se ejecutará el servidor

4. Finalmente, realizar la ejecución del proyecto usando `yarn start`.
