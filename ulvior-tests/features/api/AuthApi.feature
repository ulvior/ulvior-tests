# language: es
@api @AuthApi
Característica: AuthApi
  Como equipo de QA
  quiero capturar evidencia paso a paso de autenticación API
  para validar entradas, respuestas y resultado final en PDF.

  Escenario: Login por credenciales deja evidencia del request y response
    Dado que uso el servicio "api"
    Cuando envio POST a "/auth/login" con JSON:
      """
      {
        "email": "{{TEST_ADMIN_EMAIL}}",
        "password": "{{TEST_ADMIN_PASSWORD}}"
      }
      """
    Entonces el status HTTP debe ser uno de "200, 201, 401"

  Escenario: Login real permite consultar el usuario autenticado con cookie httpOnly
    Dado que uso el servicio "api"
    Cuando envio POST a "/auth/login" con JSON:
      """
      {
        "email": "{{TEST_ADMIN_EMAIL}}",
        "password": "{{TEST_ADMIN_PASSWORD}}"
      }
      """
    Entonces el status HTTP debe ser uno de "200, 201"
    Cuando envio GET a "/auth/me"
    Entonces el status HTTP debe ser 200
    Y la respuesta debe contener la propiedad "rol"

  Escenario: Consulta de usuario sin token queda protegida
    Dado que uso el servicio "api"
    Cuando envio GET a "/auth/me"
    Entonces el status HTTP debe ser uno de "401, 403"

  Esquema del escenario: Endpoints de auth públicos responden con validación controlada
    Dado que uso el servicio "api"
    Cuando envio POST a "<ruta>" con JSON:
      """
      <payload>
      """
    Entonces el status HTTP debe ser uno de "<status>"

    Ejemplos:
      | ruta                            | status        | payload |
      | /auth/registro/candidato        | 201, 400, 409 | {"nombre":"QA Candidate","email":"bdd-candidate@ulvior.test","password":"Cand123!","confirmPassword":"Cand123!"} |
      | /auth/registro/google/candidato | 400, 401      | {"credential":"invalid-google-token"} |
      | /auth/invitacion/validar        | 200, 400      | {"codigo":"BDD-CODE"} |
      | /auth/registro/empresa/BDD-CODE | 201, 400, 409 | {"nombre_contacto":"QA Empresa","password":"Empresa123!","confirmPassword":"Empresa123!","nombre_empresa":"Ulvior QA"} |
      | /auth/email/verify              | 200, 400      | {"token":"invalid-token"} |
      | /auth/email/resend              | 200, 201, 400, 404 | {"email":"bdd-candidate@ulvior.test"} |
      | /auth/login/google              | 400, 401      | {"credential":"invalid-google-token"} |
