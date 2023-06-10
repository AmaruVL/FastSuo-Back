CREATE TABLE IF NOT EXISTS "menu_acceso"(
    "menu_codigo" VARCHAR(6) NOT NULL,
    "menu_etiqueta" VARCHAR(30) NOT NULL,
    "descripcion" VARCHAR(60) NOT NULL,
    "nivel" SMALLINT NOT NULL,
    "modulo" VARCHAR(20),
    "tipo_modulo" VARCHAR(25),
    "imagen" VARCHAR(50),
    "ambito_acceso" VARCHAR(15),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY("menu_codigo")
); 

CREATE TABLE IF NOT EXISTS "perfil"(
    "perfil_codigo" SMALLINT NOT NULL,
    "perfil_nombre" VARCHAR(100),
    "descripcion" VARCHAR(200),
    "icono" VARCHAR(20),
    "estado_registro" BOOLEAN,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY("perfil_codigo")
); 

CREATE TABLE IF NOT EXISTS "lista_menu"(
    "menu_codigo" VARCHAR(6) NOT NULL REFERENCES "menu_acceso"("menu_codigo") ON DELETE CASCADE ON UPDATE CASCADE,
    "perfil_codigo" SMALLINT NOT NULL REFERENCES "perfil"("perfil_codigo") ON DELETE CASCADE ON UPDATE CASCADE,
    "nivel_acceso" SMALLINT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY("menu_codigo", "perfil_codigo")
); 

CREATE TABLE IF NOT EXISTS "cuenta_usuario"(
    "usuario" VARCHAR(20),
    "contrasena" VARCHAR(128),
    "usuario_nombre" VARCHAR(45),
    "pregunta_secreta" VARCHAR(60),
    "respuesta" VARCHAR(60),
    "contrasena_old" VARCHAR(128),
    "estado_registro" BOOLEAN,
    "empresa_codigo" VARCHAR(14) REFERENCES "empresa"("empresa_codigo"),
    "perfil_codigo" SMALLINT REFERENCES "perfil"("perfil_codigo"),
    "caja_codigo" VARCHAR(7) REFERENCES "caja"("caja_codigo"),
    "puede_editar_DT" BOOLEAN,
    "pc_sn" VARCHAR(50),
    "modo_conexion" INTEGER,
    "tipo_arqueo" VARCHAR(30),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY("usuario")
); 

CREATE TABLE IF NOT EXISTS "cuenta"(
    "cuenta_codigo" VARCHAR(8) NOT NULL,
    "cuenta_denominacion" VARCHAR(120),
    "cuenta_tipo" VARCHAR(12),
    "codigo_sunat" INTEGER,
    "cuenta_obs" VARCHAR(120),
    "estado_registro" BOOLEAN,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY("cuenta_codigo")
); 

CREATE TABLE IF NOT EXISTS "cliente_proveedor"(
    "id_cliente" VARCHAR(12) NOT NULL,
    "cliente_tipo_persona" VARCHAR(9),
    "nombres" VARCHAR(35),
    "ap_paterno" VARCHAR(30),
    "ap_materno" VARCHAR(30),
    "razon_social" VARCHAR(100),
    "sexo" BOOLEAN,
    "fecha_nacimiento" DATE,
    "nro_fijo" VARCHAR(12),
    "nro_movil" VARCHAR(12),
    "correo" VARCHAR(40),
    "direccion" VARCHAR(50),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY("id_cliente")
); 

CREATE TABLE IF NOT EXISTS "configuracion"(
    "clave" VARCHAR(50) NOT NULL,
    "valor" VARCHAR(250) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY("clave")
); 

CREATE TABLE IF NOT EXISTS "tipo_conexion"(
    "usuario" VARCHAR(20) NOT NULL REFERENCES "cuenta_usuario"("usuario"),
    "fecha_trabajo" DATE NOT NULL,
    "caja_codigo" VARCHAR(7) NOT NULL REFERENCES "caja"("caja_codigo"),
    "fecha_hora_apertura" TIMESTAMP WITH TIME ZONE,
    "estado_caja" VARCHAR(10),
    "tipo_conexion_sistema_op" VARCHAR(255),
    "tipo_conexion_navegador" VARCHAR(255),
    "tipo_dispositivo" VARCHAR(250),
    "pc_movil_marca" VARCHAR(250),
    "pc_movil_modelo" VARCHAR(250),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY("usuario", "caja_codigo")
);