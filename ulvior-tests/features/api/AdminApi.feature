# language: es
@api @AdminApi @regression
Característica: AdminApi
  Como equipo de QA
  quiero cubrir todos los contratos HTTP del backoffice admin
  para bloquear cambios de ambiente si una ruta protegida queda expuesta o rota.

  Esquema del escenario: Endpoints admin protegidos sin sesión
    Dado que uso el servicio "api"
    Cuando envio <metodo> a "<ruta>" sin JSON
    Entonces el status HTTP debe ser uno de "401, 403"

    Ejemplos:
      | metodo | ruta                                            |
      | GET    | /admin/metricas                                  |
      | GET    | /admin/pipeline                                  |
      | POST   | /admin/pipeline                                  |
      | GET    | /admin/pipeline/00000000-0000-0000-0000-000000000000 |
      | PATCH  | /admin/pipeline/00000000-0000-0000-0000-000000000000/notas |
      | POST   | /admin/pipeline/00000000-0000-0000-0000-000000000000/shortlist |
      | POST   | /admin/pipeline/00000000-0000-0000-0000-000000000000/colocar |
      | POST   | /admin/pipeline/00000000-0000-0000-0000-000000000000/candidatos/seleccionar |
      | POST   | /admin/pipeline/00000000-0000-0000-0000-000000000000/candidatos/no-seleccionar |
      | POST   | /admin/pipeline/00000000-0000-0000-0000-000000000000/candidatos |
      | POST   | /admin/pipeline/00000000-0000-0000-0000-000000000000/entrevistas |
      | GET    | /admin/candidatos                                |
      | POST   | /admin/candidatos                                |
      | GET    | /admin/candidatos/00000000-0000-0000-0000-000000000000 |
      | PATCH  | /admin/candidatos/00000000-0000-0000-0000-000000000000 |
      | GET    | /admin/empresas                                  |
      | POST   | /admin/empresas                                  |
      | GET    | /admin/empresas/00000000-0000-0000-0000-000000000000 |
      | PATCH  | /admin/empresas/00000000-0000-0000-0000-000000000000 |
      | PUT    | /admin/empresas/00000000-0000-0000-0000-000000000000/habilitar |
      | POST   | /admin/invitaciones                              |
      | GET    | /admin/empresas/00000000-0000-0000-0000-000000000000/invitaciones |
      | GET    | /admin/solicitudes                               |
      | GET    | /admin/solicitudes/00000000-0000-0000-0000-000000000000 |
      | POST   | /admin/solicitudes/00000000-0000-0000-0000-000000000000/gestionar |
      | POST   | /admin/solicitudes/00000000-0000-0000-0000-000000000000/entrevistas |
      | GET    | /admin/entrevistas                               |
      | GET    | /admin/entrevistas/00000000-0000-0000-0000-000000000000 |
      | PATCH  | /admin/entrevistas/00000000-0000-0000-0000-000000000000/marcar-realizada |
      | GET    | /admin/ai/evaluaciones                           |
      | POST   | /admin/ai/evaluaciones/00000000-0000-0000-0000-000000000000/generar |
      | POST   | /admin/ai/evaluaciones/00000000-0000-0000-0000-000000000000/interview-score |
      | GET    | /admin/ai/scraping/historial                     |
      | GET    | /admin/ai/scraping/perfiles/00000000-0000-0000-0000-000000000000 |
      | POST   | /admin/ai/scraping/ejecutar                      |
      | POST   | /admin/ai/scraping/historial/limpiar             |
      | POST   | /admin/ai/scraping/candidatos/limpiar            |
