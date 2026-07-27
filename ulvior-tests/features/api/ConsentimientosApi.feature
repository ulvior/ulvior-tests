# language: es
@api @ConsentimientosApi @regression
Característica: ConsentimientosApi
  Como QA
  quiero cubrir el consentimiento de datos del candidato y sus derechos ARCO+
  para validar registro, revocación, bloqueo de IA y portabilidad de datos.

  Escenario: Registro de candidato exige aceptar los consentimientos obligatorios
    Dado que uso el servicio "api"
    Cuando envio POST a "/auth/registro/candidato" con JSON:
      """
      {
        "nombre": "QA Consentimiento Rechazo",
        "email": "qa.consentimiento.rechazo.{{E2E_RUN_ID}}@ulvior.test",
        "password": "UlviorQA2026!",
        "confirmPassword": "UlviorQA2026!",
        "acepta_terminos": false,
        "acepta_evaluacion_ia": true,
        "acepta_compartir_empresas": true
      }
      """
    Entonces el status HTTP debe ser 400

  Escenario: Registro de empresa exige aceptar términos y privacidad del contacto
    Dado que uso el servicio "api"
    Cuando envio POST a "/auth/registro/empresa/BDD-CODE" con JSON:
      """
      {
        "nombre_contacto": "QA Empresa Rechazo",
        "password": "Empresa123!",
        "confirmPassword": "Empresa123!",
        "nombre_empresa": "Ulvior QA",
        "acepta_terminos": false
      }
      """
    Entonces el status HTTP debe ser 400
    Y la respuesta JSON debe contener el texto "Política de Privacidad"

  Escenario: Candidato autenticado consulta su estado de privacidad
    Dado que uso el servicio "api"
    Cuando envio POST a "/auth/login" con JSON:
      """
      {
        "email": "{{TEST_CANDIDATO_EMAIL}}",
        "password": "{{TEST_CANDIDATO_PASSWORD}}"
      }
      """
    Entonces el status HTTP debe ser uno de "200, 201"
    Cuando envio GET a "/candidato/privacidad"
    Entonces el status HTTP debe ser 200
    Y la respuesta debe contener la propiedad "consentimientos"
    Y la respuesta debe contener la propiedad "solicitudes"
    Y la respuesta debe contener la propiedad "compartido_con"
    Y el consentimiento "tos" debe estar "otorgado"

  Escenario: Revocar la evaluación con IA bloquea el análisis de CV hasta reactivarla
    Dado que uso el servicio "api"
    Cuando envio POST a "/auth/login" con JSON:
      """
      {
        "email": "{{TEST_CANDIDATO_EMAIL}}",
        "password": "{{TEST_CANDIDATO_PASSWORD}}"
      }
      """
    Entonces el status HTTP debe ser uno de "200, 201"
    Cuando envio DELETE a "/candidato/privacidad/consentimientos/ia_evaluacion"
    Entonces el status HTTP debe ser 200
    Y el consentimiento "ia_evaluacion" debe estar "revocado"
    Cuando envio POST a "/candidato/perfil/cv/analyze" con JSON:
      """
      {}
      """
    Entonces el status HTTP debe ser 403
    Y la respuesta JSON debe contener el texto "Centro de Privacidad"
    Cuando envio POST a "/candidato/privacidad/consentimientos/ia_evaluacion" sin JSON
    Entonces el status HTTP debe ser 201
    Y el consentimiento "ia_evaluacion" debe estar "otorgado"

  Escenario: No se puede revocar un consentimiento necesario para el servicio
    Dado que uso el servicio "api"
    Cuando envio POST a "/auth/login" con JSON:
      """
      {
        "email": "{{TEST_CANDIDATO_EMAIL}}",
        "password": "{{TEST_CANDIDATO_PASSWORD}}"
      }
      """
    Entonces el status HTTP debe ser uno de "200, 201"
    Cuando envio DELETE a "/candidato/privacidad/consentimientos/tos"
    Entonces el status HTTP debe ser 400

  Escenario: Candidato crea una solicitud de derecho ARCO+ y queda pendiente
    Dado que uso el servicio "api"
    Cuando envio POST a "/auth/login" con JSON:
      """
      {
        "email": "{{TEST_CANDIDATO_EMAIL}}",
        "password": "{{TEST_CANDIDATO_PASSWORD}}"
      }
      """
    Entonces el status HTTP debe ser uno de "200, 201"
    Cuando envio POST a "/candidato/privacidad/solicitudes" con JSON:
      """
      {
        "tipo": "revision_humana_ia",
        "detalle": "Solicitud generada por regresión automatizada."
      }
      """
    Entonces el status HTTP debe ser 201
    Y la respuesta debe contener la propiedad "id"
    Y la respuesta JSON debe contener el texto "pendiente"

  Escenario: Exportar mis datos no filtra el hash de contraseña
    Dado que uso el servicio "api"
    Cuando envio POST a "/auth/login" con JSON:
      """
      {
        "email": "{{TEST_CANDIDATO_EMAIL}}",
        "password": "{{TEST_CANDIDATO_PASSWORD}}"
      }
      """
    Entonces el status HTTP debe ser uno de "200, 201"
    Cuando envio GET a "/candidato/privacidad/exportar"
    Entonces el status HTTP debe ser 200
    Y la respuesta debe contener la propiedad "cuenta"
    Y la respuesta debe contener la propiedad "privacidad"
    Y la respuesta JSON no debe contener el texto "password_hash"
