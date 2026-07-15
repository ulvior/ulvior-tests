# language: es
@api @CandidatoApi @regression
Característica: CandidatoApi
  Como QA
  quiero cubrir el portal candidato desde API
  para validar perfiles, procesos, empleos, postulaciones y evaluaciones.

  Esquema del escenario: Endpoints candidato protegidos sin sesión
    Dado que uso el servicio "api"
    Cuando envio <metodo> a "<ruta>" sin JSON
    Entonces el status HTTP debe ser uno de "401, 403"

    Ejemplos:
      | metodo | ruta                                            |
      | GET    | /candidato/perfil                               |
      | PUT    | /candidato/perfil                               |
      | POST   | /candidato/perfil/cv                            |
      | DELETE | /candidato/perfil/cv                            |
      | GET    | /candidato/perfil/cv/download                   |
      | POST   | /candidato/perfil/cv/analyze                    |
      | GET    | /candidato/home                                 |
      | GET    | /candidato/entrevistas                          |
      | GET    | /candidato/documentos                           |
      | GET    | /candidato/evaluacion-ai                        |
      | POST   | /candidato/evaluacion-ai/regenerar              |
      | GET    | /candidato/evaluacion-coding                    |
      | POST   | /candidato/evaluacion-coding/analizar           |
      | POST   | /candidato/evaluacion-coding/ejecutar           |
      | POST   | /candidato/evaluacion-coding/preguntas/generar  |
      | POST   | /candidato/evaluacion-coding/preguntas/responder |
      | GET    | /candidato/procesos                             |
      | GET    | /candidato/procesos/00000000-0000-0000-0000-000000000000 |
      | GET    | /candidato/procesos/00000000-0000-0000-0000-000000000000/entrevistas |
      | POST   | /candidato/entrevistas/00000000-0000-0000-0000-000000000000/confirmar |
      | GET    | /candidato/perfil/test-fit                      |
      | POST   | /candidato/perfil/test-fit                      |
      | GET    | /candidato/empleos                              |
      | GET    | /candidato/empleos/00000000-0000-0000-0000-000000000000 |
      | GET    | /candidato/postulaciones                        |
      | POST   | /candidato/empleos/00000000-0000-0000-0000-000000000000/postular |
      | DELETE | /candidato/postulaciones/00000000-0000-0000-0000-000000000000 |
