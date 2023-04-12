DROP FUNCTION IF EXISTS obtener_saldos_caja;
CREATE OR REPLACE FUNCTION obtener_saldos_caja(
    IN fecha DATE DEFAULT date(current_date),
    IN caja_cod VARCHAR(12) DEFAULT null
  )
  RETURNS TABLE (
    "Saldo1" DECIMAL(12,2),
    "Saldo2" DECIMAL(12,2),
    "Saldo3" DECIMAL(12,2)
  ) 
  LANGUAGE 'plpgsql'
    
  AS $BODY$
    BEGIN
      RETURN QUERY
        SELECT 
        COALESCE(SUM("tabla_suma"."Saldo1"),0) AS "Saldo1", 
        COALESCE(SUM("tabla_suma"."Saldo2"),0) AS "Saldo2", 
        COALESCE(SUM("tabla_suma"."Saldo3"),0) AS "Saldo3"
        FROM(
          SELECT 
            ((COALESCE(SUM("op_caja"."moneda1_Ingre"),0) - COALESCE(SUM("op_caja"."moneda1_Egre"),0))) ::DECIMAL(12,2) AS "Saldo1" , 
            ((COALESCE(SUM("op_caja"."moneda2_Ingre"),0) - COALESCE(SUM("op_caja"."moneda2_Egre"),0))) ::DECIMAL(12,2) AS "Saldo2" , 
            ((COALESCE(SUM("op_caja"."moneda3_Ingre"),0) - COALESCE(SUM("op_caja"."moneda3_Egre"),0))) ::DECIMAL(12,2) AS "Saldo3",
            "fecha_trabajo"
          FROM
            "operacion_caja" AS "op_caja"
          WHERE "op_caja"."fecha_trabajo" = date(fecha) AND  "op_caja"."caja_codigo" = caja_cod
          GROUP BY "fecha_trabajo"

          UNION ALL 

          (SELECT 
          "cja_trabajo"."Saldo1"::DECIMAL(12,2)AS "Saldo1",
          "cja_trabajo"."Saldo2"::DECIMAL(12,2)AS "Saldo2",
          "cja_trabajo"."Saldo3"::DECIMAL(12,2)AS "Saldo3",
          "cja_trabajo"."fecha_trabajo"
          FROM "caja_trabajo" AS "cja_trabajo"
          WHERE "cja_trabajo"."caja_codigo" = caja_cod AND "cja_trabajo"."estado_caja" = 'CERRADO' AND "cja_trabajo"."fecha_trabajo" !=date(fecha)
          ORDER BY "fecha_trabajo" DESC
          LIMIT 1)
        )tabla_suma;
    END;
  $BODY$;