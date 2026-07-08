# language: es
@api @EmpresaApi @regression
Característica: EmpresaApi
  Como QA
  quiero cubrir el portal empresa desde API
  para validar que dashboard, búsquedas, candidatos, entrevistas y solicitudes mantengan control de acceso.

  Esquema del escenario: Endpoints empresa protegidos sin sesión
    Dado que uso el servicio "api"
    Cuando envio <metodo> a "<ruta>" sin JSON
    Entonces el status HTTP debe ser uno de "401, 403"

    Ejemplos:
      | metodo | ruta                                            |
      | GET    | /empresa/dashboard                              |
      | GET    | /empresa/perfil                                 |
      | PUT    | /empresa/perfil                                 |
      | GET    | /empresa/busquedas                              |
      | GET    | /empresa/busquedas/historial                    |
      | GET    | /empresa/busquedas/00000000-0000-0000-0000-000000000000 |
      | POST   | /empresa/busquedas                              |
      | PUT    | /empresa/busquedas/00000000-0000-0000-0000-000000000000 |
      | GET    | /empresa/busquedas/00000000-0000-0000-0000-000000000000/shortlist |
      | GET    | /empresa/busquedas/00000000-0000-0000-0000-000000000000/candidato/00000000-0000-0000-0000-000000000000 |
      | POST   | /empresa/busquedas/00000000-0000-0000-0000-000000000000/shortlist/00000000-0000-0000-0000-000000000000/aprobar |
      | POST   | /empresa/busquedas/00000000-0000-0000-0000-000000000000/shortlist/00000000-0000-0000-0000-000000000000/rechazar |
      | GET    | /empresa/entrevistas                            |
      | GET    | /empresa/busquedas/00000000-0000-0000-0000-000000000000/entrevistas |
      | POST   | /empresa/busquedas/00000000-0000-0000-0000-000000000000/entrevistas |
      | POST   | /empresa/entrevistas/00000000-0000-0000-0000-000000000000/confirmar |
      | POST   | /empresa/entrevistas/00000000-0000-0000-0000-000000000000/feedback |
      | POST   | /empresa/entrevistas/00000000-0000-0000-0000-000000000000/decision |
      | GET    | /empresa/profesionales                          |
      | GET    | /empresa/profesionales/00000000-0000-0000-0000-000000000000 |
      | GET    | /empresa/solicitudes                            |
      | POST   | /empresa/solicitudes                            |
      | GET    | /notificaciones                                 |
      | PATCH  | /notificaciones/00000000-0000-0000-0000-000000000000/leida |
      | GET    | /empresa/candidatos/00000000-0000-0000-0000-000000000000/documentos |
      | GET    | /empresa/candidatos/00000000-0000-0000-0000-000000000000/documentos/evaluacion-pdf |
      | GET    | /empresa/privacidad/terms                       |
      | GET    | /empresa/privacidad/candidato/00000000-0000-0000-0000-000000000000 |
      | POST   | /empresa/privacidad/candidato/00000000-0000-0000-0000-000000000000 |
