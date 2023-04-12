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

CREATE TABLE IF NOT EXISTS "empresa"(
    "empresa_codigo" VARCHAR(14) NOT NULL,
    "razon_social" VARCHAR(250) NOT NULL,
    "ruc" VARCHAR(12),
    "contacto_nombre" VARCHAR(45),
    "contacto_nro" VARCHAR(20),
    "estado_registro" BOOLEAN,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY("empresa_codigo")
); 

CREATE TABLE IF NOT EXISTS "oficina"(
    "oficina_codigo" VARCHAR(12) NOT NULL,
    "oficina_nombre" VARCHAR(20),
    "oficina_tipo" VARCHAR(10),
    "oficina_ubicacion" VARCHAR(250),
    "oficina_direccion" VARCHAR(80),
    "oficina_referencia" VARCHAR(120),
    "oficina_correo" VARCHAR(45),
    "oficina_encargado" VARCHAR(45),
    "estado_registro" BOOLEAN,
    "modo_conexion" INTEGER,
    "empresa_codigo" VARCHAR(14) REFERENCES "empresa"("empresa_codigo"),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY("oficina_codigo")

); 

CREATE TABLE IF NOT EXISTS "caja"(
    "caja_codigo" VARCHAR(7) NOT NULL,
    "caja_nombre" VARCHAR(120),
    "direccion_ip_acceso" VARCHAR(35),
    "direccion_mac" VARCHAR(17),
    "caja_contrasena" VARCHAR(120),
    "almacen_defecto" VARCHAR(18),
    "caja_bitacora" VARCHAR(250),
    "estado_registro" BOOLEAN,
    "oficina_codigo" VARCHAR(12) REFERENCES "oficina"("oficina_codigo"),
    "verificar_saldo_caja" VARCHAR(30),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY("caja_codigo")
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


CREATE TABLE IF NOT EXISTS "comision"(
    "id_comision" SERIAL,
    "monto_minimo" DECIMAL(8, 2),
    "monto_maximo" DECIMAL(8, 2),
    "comision" DECIMAL(8, 3),
    "tipo_comision" VARCHAR(10),
    "oficina_codigo" VARCHAR(12) NOT NULL REFERENCES "oficina"("oficina_codigo"),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY("id_comision")
); 

CREATE TABLE IF NOT EXISTS "contrato"(
    "contrato_fecha_inicio" DATE,
    "contrato_fecha_fin" DATE,
    "credito_maximo" DECIMAL(8, 2),
    "dt_directo" DECIMAL(8, 3),
    "dt_afiliado" DECIMAL(8, 3),
    "dt_tercero" DECIMAL(8, 3),
    "nro_contrato" INTEGER NOT NULL,
    "monto_alerta" DECIMAL(8, 3),
    "oficina_codigo" VARCHAR(12) NOT NULL REFERENCES "oficina"("oficina_codigo"),
    "contrato_estado" VARCHAR(12),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY("nro_contrato", "oficina_codigo")
); 

CREATE TABLE IF NOT EXISTS "documento"(
    "documento_codigo" VARCHAR(4) NOT NULL,
    "documento_descripcion" VARCHAR(35),
    "tipo_documento" VARCHAR(12),
    "codigo_sunat" VARCHAR(4),
    "estado_registro" BOOLEAN,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY("documento_codigo")
); 

CREATE TABLE IF NOT EXISTS "documento_serie"(
    "documento_codigo" VARCHAR(4) NOT NULL REFERENCES "documento"("documento_codigo"),
    "documento_serie" INTEGER NOT NULL,
    "nro_inicio" INTEGER,
    "fecha_activacion" DATE,
    "fecha_baja" DATE,
    "afecto" BOOLEAN,
    "formato" VARCHAR(40),
    "estado_registro" BOOLEAN,
    "oficina_codigo" VARCHAR(12) REFERENCES "oficina"("oficina_codigo"),
    "modulo" VARCHAR(20),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY(
        "documento_codigo",
        "documento_serie"
    )
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

CREATE TABLE IF NOT EXISTS "centro_costo"(
    "centro_costo_id" VARCHAR(12) NOT NULL,
    "centro_costo_nombre" VARCHAR(35),
    "oficina_codigo" VARCHAR(12) REFERENCES "oficina"("oficina_codigo"),
    "centro_costo_obs" VARCHAR(120),
    "estado_registro" BOOLEAN,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY("centro_costo_id")
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

CREATE TABLE IF NOT EXISTS "caja_trabajo"(
    "fecha_trabajo" DATE NOT NULL,
    "caja_codigo" VARCHAR(7) NOT NULL REFERENCES "caja"("caja_codigo"),
    "usuario_apertura" VARCHAR(20) REFERENCES "cuenta_usuario"("usuario"),
    "fecha_hora_apertura" TIMESTAMP WITH TIME ZONE,
    "fecha_hora_cierre" TIMESTAMP WITH TIME ZONE,
    "usuario_cierre" VARCHAR(20) REFERENCES "cuenta_usuario"("usuario"),
    "estado_caja" VARCHAR(10),
    "Saldo1" DECIMAL(10, 3),
    "Saldo2" DECIMAL(10, 3),
    "Saldo3" DECIMAL(10, 3),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY("fecha_trabajo", "caja_codigo")
); 

CREATE TABLE IF NOT EXISTS "operacion_caja"(
    "documento_codigo" VARCHAR(4) NOT NULL,
    "documento_serie" INTEGER NOT NULL,
    "nro_operacion" INTEGER NOT NULL,
    "nro_transaccion" INTEGER,
    "nro_transaccion_dia" INTEGER,
    "fecha_hora_operacion" TIMESTAMP WITH TIME ZONE,
    "id_cliente" VARCHAR(12) REFERENCES "cliente_proveedor"("id_cliente"),
    "cliente_razon_social" VARCHAR(100),
    "oficina_origen_codigo" VARCHAR(12),
    "fecha_trabajo" DATE,
    "caja_codigo" VARCHAR(7),
    "cuenta_codigo" VARCHAR(8) REFERENCES "cuenta"("cuenta_codigo"),
    "codigo_validador" VARCHAR(8),
    "concepto" VARCHAR(400),
    "tipo_cambio" DECIMAL(8, 4),
    "moneda1_Ingre" DECIMAL(10, 2),
    "moneda1_Egre" DECIMAL(10, 2),
    "moneda2_Ingre" DECIMAL(10, 2),
    "moneda2_Egre" DECIMAL(10, 2),
    "moneda3_Ingre" DECIMAL(10, 2),
    "moneda3_Egre" DECIMAL(10, 2),
    "modulo" VARCHAR(20),
    "usuario" VARCHAR(20) REFERENCES "cuenta_usuario"("usuario"),
    "registrado_central" BOOLEAN,
    "estado_registro" INTEGER,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY(
        "documento_codigo",
        "documento_serie",
        "nro_operacion"
    ),
    FOREIGN KEY ("documento_codigo","documento_serie") REFERENCES "documento_serie" ("documento_codigo","documento_serie"),
    FOREIGN KEY ("fecha_trabajo","caja_codigo") REFERENCES "caja_trabajo" ("fecha_trabajo","caja_codigo")
); 

CREATE TABLE IF NOT EXISTS "recibo_interno"(
    "recibo_doc_codigo" VARCHAR(4) NOT NULL,
    "recibo_doc_serie" INTEGER NOT NULL,
    "recibo_nro" INTEGER NOT NULL,
    "cuenta_codigo" VARCHAR(8) REFERENCES "cuenta"("cuenta_codigo"),
    "id_cliente" VARCHAR(12) REFERENCES "cliente_proveedor"("id_cliente"),
    "recibo_tipo" VARCHAR(8),
    "razon_social" VARCHAR(100),
    "recibo_concepto" VARCHAR(50),
    "moneda" VARCHAR(7),
    "importe" DECIMAL(10, 3),
    "recibo_obs" VARCHAR(120),
    "recibo_finalidad" VARCHAR(30),
    "centro_costo_id" VARCHAR(12) REFERENCES "centro_costo"("centro_costo_id"),
    "recibo_fecha_hora" TIMESTAMP WITH TIME ZONE,
    "estado_registro" INTEGER,
    "anulacion_doc_codigo" VARCHAR(4),
    "anulacion_doc_serie" INTEGER,
    "anulacion_recibo_nro" INTEGER,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY(
        "recibo_doc_codigo",
        "recibo_doc_serie",
        "recibo_nro"
    ),
    FOREIGN KEY (
        "recibo_doc_codigo",
        "recibo_doc_serie",
        "recibo_nro"
        ) REFERENCES "operacion_caja" ("documento_codigo","documento_serie","nro_operacion"),
    FOREIGN KEY (
        "anulacion_doc_codigo",
        "anulacion_doc_serie",
        "anulacion_recibo_nro"
        ) REFERENCES "operacion_caja" ("documento_codigo","documento_serie","nro_operacion")

); 

CREATE TABLE IF NOT EXISTS "entidad_financiera_servicios"(
    "entidad_codigo" VARCHAR(12) NOT NULL,
    "entidad_razon_social" VARCHAR(35),
    "entidad_tipo" VARCHAR(12),
    "comision" BOOLEAN,
    "cuenta_codigo" VARCHAR(8),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY("entidad_codigo")
); 

CREATE TABLE IF NOT EXISTS "habilitacion"(
    "origen_docu_codigo" VARCHAR(4) NOT NULL,
    "origen_docu_serie" INTEGER NOT NULL,
    "origen_nro_operacion" INTEGER NOT NULL,
    "tipo_habilitacion" VARCHAR(15),
    "importe" DECIMAL(10, 3),
    "moneda" VARCHAR(10),
    "destino_documento_codigo" VARCHAR(4),
    "destino_documento_serie" INTEGER,
    "destino_nro_operacion" INTEGER,
    "origen_caja_codigo" VARCHAR(7) REFERENCES "caja"("caja_codigo"),
    "destino_oficina_codigo" VARCHAR(12) REFERENCES "oficina"("oficina_codigo"),
    "destino_caja_codigo" VARCHAR(7) REFERENCES "caja"("caja_codigo"),
    "origen_oficina_codigo" VARCHAR(12) REFERENCES "oficina"("oficina_codigo"),
    "encargado_operacion_id_cliente" VARCHAR(12) REFERENCES "cliente_proveedor"("id_cliente"),
    "habilitacion_estado" VARCHAR(9),
    "autorizada" INTEGER,
    "usuario_autorizacion" VARCHAR(20) REFERENCES "cuenta_usuario"("usuario"),
    "fecha_hora_autorizacion" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY(
        "origen_docu_codigo",
        "origen_docu_serie",
        "origen_nro_operacion"
    ),
    FOREIGN KEY (
        "origen_docu_codigo",
        "origen_docu_serie",
        "origen_nro_operacion"
        ) REFERENCES "operacion_caja" ("documento_codigo","documento_serie","nro_operacion"),
    FOREIGN KEY (
        "destino_documento_codigo",
        "destino_documento_serie",
        "destino_nro_operacion"
        ) REFERENCES "operacion_caja" ("documento_codigo","documento_serie","nro_operacion")
); 

CREATE TABLE IF NOT EXISTS "transferencia"(
    "St_documento_codigo" VARCHAR(4) NOT NULL,
    "St_documento_serie" INTEGER NOT NULL,
    "nro_Solicitud" INTEGER NOT NULL,
    "oficina_codigo_origen" VARCHAR(12) REFERENCES "oficina"("oficina_codigo"),
    "oficina_codigo_destino" VARCHAR(12) REFERENCES "oficina"("oficina_codigo"),
    "solicitud_fecha_hora" TIMESTAMP WITH TIME ZONE,
    "beneficiario_id_cliente" VARCHAR(12) REFERENCES "cliente_proveedor"("id_cliente"),
    "beneficiario_razon_social" VARCHAR(100),
    "beneficiario_docident" VARCHAR(11),
    "beneficiario_otros_datos" VARCHAR(45),
    "solicitante_id_cliente" VARCHAR(12) REFERENCES "cliente_proveedor"("id_cliente"),
    "solicitante_razon_social" VARCHAR(100),
    "solicitante_otros_datos" VARCHAR(40),
    "moneda" VARCHAR(4),
    "importe" DECIMAL(10, 3),
    "importe_pagado" DECIMAL(10, 3),
    "comision_dt" DECIMAL(7, 3),
    "comision_banco" DECIMAL(7, 3),
    "gastos_administrativos" DECIMAL(7, 3),
    "deposito_entidad_codigo" VARCHAR(12) REFERENCES "entidad_financiera_servicios"("entidad_codigo"),
    "beneficiario_nro_celular" VARCHAR(12),
    "solicitante_nro_celular" VARCHAR(12),
    "deposito_tipo" VARCHAR(30),
    "deposito_destino" VARCHAR(100),
    "deposito_nro_cuenta" VARCHAR(50),
    "deposito_nro_operacion" VARCHAR(15),
    "solicitud_obs" VARCHAR(400),
    "solicitud_msj" VARCHAR(120),
    "autorizacion_fecha_hora" TIMESTAMP WITH TIME ZONE,
    "autorizacion_usuario" VARCHAR(20) REFERENCES "cuenta_usuario"("usuario"),
    "autorizacion_estado" BOOLEAN,
    "st_autorizada" INTEGER,
    "anulacion_usuario" VARCHAR(20) REFERENCES "cuenta_usuario"("usuario"),
    "anulacion_motivo" VARCHAR(40),
    "anulacion_fecha_hora" TIMESTAMP WITH TIME ZONE,
    "op_usuario" VARCHAR(20) REFERENCES "cuenta_usuario"("usuario"),
    "op_documento_codigo" VARCHAR(4),
    "op_documento_serie" INTEGER,
    "op_nro_operacion" INTEGER,
    "op_fecha_hora" TIMESTAMP WITH TIME ZONE,
    "op_observacion" VARCHAR(120),
    "st_estado" INTEGER,
    "tipo_giro" VARCHAR(20),
    "foto" BOOLEAN,
    "dictado_usuario" VARCHAR(20) REFERENCES "cuenta_usuario"("usuario"),
    "dictado_fecha_hora" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY(
        "St_documento_codigo",
        "St_documento_serie",
        "nro_Solicitud"
    ),
    FOREIGN KEY (
        "St_documento_codigo",
        "St_documento_serie",
        "nro_Solicitud"
        ) REFERENCES "operacion_caja" ("documento_codigo","documento_serie","nro_operacion"),
    FOREIGN KEY (
        "op_documento_codigo",
        "op_documento_serie",
        "op_nro_operacion"
        ) REFERENCES "operacion_caja" ("documento_codigo","documento_serie","nro_operacion")
); 

CREATE TABLE IF NOT EXISTS "st_check"(
    "St_documento_codigo" VARCHAR(4) NOT NULL,
    "St_documento_serie" INTEGER NOT NULL,
    "nro_Solicitud" INTEGER NOT NULL,
    "check" BOOLEAN,
    "dt_origen" DECIMAL(7, 2),
    "dt_origen_comision" DECIMAL(7, 2),
    "dt_destino" DECIMAL(7, 2),
    "dt_destino_comision" DECIMAL(7, 2),
    "usuario_check" VARCHAR(20) REFERENCES "cuenta_usuario"("usuario"),
    "check_fecha_hora" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY(
        "St_documento_codigo",
        "St_documento_serie",
        "nro_Solicitud"
    ),
    FOREIGN KEY (
        "St_documento_codigo",
        "St_documento_serie",
        "nro_Solicitud"
        ) REFERENCES "transferencia" ("St_documento_codigo","St_documento_serie","nro_Solicitud")
);

CREATE TABLE IF NOT EXISTS "configuracion"(
    "clave" VARCHAR(50) NOT NULL,
    "valor" VARCHAR(250) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY("clave")
); 

CREATE TABLE IF NOT EXISTS "moneda_denominacion"(
    "id" SERIAL,
    "tipo_moneda" VARCHAR(18),
    "nombre" VARCHAR(50),
    "valor" DECIMAL(6, 2),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY("id")
); 

CREATE TABLE IF NOT EXISTS "moneda_cierre"(
    "id" INT REFERENCES moneda_denominacion (id),
    "fecha_trabajo" DATE,
    "caja_codigo" VARCHAR(7),
    "cantidad" INTEGER,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    FOREIGN KEY ("fecha_trabajo","caja_codigo") REFERENCES "caja_trabajo" ("fecha_trabajo","caja_codigo")
);

CREATE TABLE IF NOT EXISTS "cuenta_corriente"(
    "id_cuenta"  VARCHAR(20) NOT NULL,
    "entidad_codigo" VARCHAR(12),
    "id_cliente" VARCHAR(12),
    "tipo_cta" VARCHAR(45),
    "tipo_cta_bancaria" VARCHAR(45),
    "tasa_interes_mensual" DECIMAL(6,3),
    "cta_observacion" VARCHAR(250),
    "estado_registro" BOOLEAN,
    "oficina_codigo_src" VARCHAR(12),
    "es_servicio" BOOLEAN,
    "credito_maximo_soles" DECIMAL(8,2),
    "credito_maximo_dolares" DECIMAL(8,2),
    "credito_maximo_otros" DECIMAL(8,2),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY("id_cuenta"),
    FOREIGN KEY ("entidad_codigo") REFERENCES "entidad_financiera_servicios" ("entidad_codigo"),
    FOREIGN KEY ("id_cliente") REFERENCES "cliente_proveedor" ("id_cliente"),
    FOREIGN KEY ("oficina_codigo_src") REFERENCES "oficina" ("oficina_codigo")
);

CREATE TABLE IF NOT EXISTS "operacion_cuenta"(
    "documento_codigo"  VARCHAR(4) NOT NULL,
    "documento_serie" INTEGER NOT NULL,
    "nro_operacion" INTEGER NOT NULL,
    "recibo_tipo" VARCHAR(45),
    "codigo_insumo" VARCHAR(50),
    "razon_social" VARCHAR(250),
    "importe"  DECIMAL(10, 3),
    "comision" DECIMAL(7, 3),
    "moneda" INTEGER,
    "id_cuenta_tercera" VARCHAR(20),
    "entidad_codigo" VARCHAR(12),
    "cuenta_codigo" VARCHAR(8),
    "cuenta_nro_operacion" VARCHAR(20),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY(
        "documento_codigo",
        "documento_serie",
        "nro_operacion"
    ),
    FOREIGN KEY (
        "documento_codigo",
        "documento_serie",
        "nro_operacion"
        ) REFERENCES "operacion_caja" ("documento_codigo","documento_serie","nro_operacion"),
    FOREIGN KEY ("id_cuenta_tercera") REFERENCES "cuenta_corriente" ("id_cuenta"),
    FOREIGN KEY ("entidad_codigo") REFERENCES "entidad_financiera_servicios" ("entidad_codigo"),
    FOREIGN KEY ("cuenta_codigo") REFERENCES "cuenta" ("cuenta_codigo")
);

CREATE TABLE IF NOT EXISTS "notificacion"(
    "id" SERIAL,
    "fecha_registro" TIMESTAMP WITH TIME ZONE,
    "texto1" TEXT,
    "texto2" TEXT,
    "texto3" TEXT,
    "usuario_registro" VARCHAR(20),
    "tipo" VARCHAR(250),
    "grupo" VARCHAR(250),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY("id"),
    FOREIGN KEY ("usuario_registro") REFERENCES "cuenta_usuario" ("usuario")
);

CREATE TABLE IF NOT EXISTS "usuario_notificacion"(
    "id_usuario" VARCHAR(20),
    "id_notificacion" INTEGER,
    "leido" BOOLEAN,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    FOREIGN KEY ("id_usuario") REFERENCES "cuenta_usuario" ("usuario"),
    FOREIGN KEY ("id_notificacion") REFERENCES "notificacion" ("id"),
    CONSTRAINT usuario_notificacion_id_unique UNIQUE ("id_usuario", "id_notificacion")
);

CREATE TABLE IF NOT EXISTS "centro_poblado"(
    "id_centro_poblado" SERIAL,
    "nombre_centro_poblado" VARCHAR(255),
    "ubicacion"  VARCHAR(500),
    "extension"  VARCHAR(255),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY("id_centro_poblado")
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