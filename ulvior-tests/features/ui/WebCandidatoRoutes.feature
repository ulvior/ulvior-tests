# language: es
@ui @WebCandidatoRoutes @regression
Característica: WebCandidatoRoutes
  Como QA
  quiero cubrir todas las rutas del portal candidato
  para validar redirección segura sin sesión y evidencia visual.

  Esquema del escenario: Ruta candidato protegida redirige a login
    Dado abro la pagina "<ruta>"
    Entonces la URL debe contener "/login"
    Y debo ver el boton "Iniciar sesión"

    Ejemplos:
      | ruta                                                            |
      | /candidato/home                                                 |
      | /candidato/perfil                                               |
      | /candidato/perfil/editar                                        |
      | /candidato/test-fit                                             |
      | /candidato/test-fit/completar                                   |
      | /candidato/test-fit/resultado                                   |
      | /candidato/procesos                                             |
      | /candidato/procesos/00000000-0000-0000-0000-000000000000         |
      | /candidato/entrevistas                                          |
      | /candidato/empleos                                              |
      | /candidato/empleos/00000000-0000-0000-0000-000000000000          |
      | /candidato/empleos/00000000-0000-0000-0000-000000000000/postular |
      | /candidato/postulaciones                                        |
      | /candidato/evaluacion-ai                                        |
      | /candidato/evaluacion-coding                                    |
