# language: es
@ui @WebAdminRoutes @regression
Característica: WebAdminRoutes
  Como QA
  quiero cubrir todas las rutas del backoffice web
  para validar que ninguna página admin quede accesible sin autenticación.

  Esquema del escenario: Ruta admin protegida redirige a login
    Dado abro la pagina "<ruta>"
    Entonces la URL debe contener "/login"
    Y debo ver el boton "Iniciar sesión"

    Ejemplos:
      | ruta                                                            |
      | /admin/dashboard                                                |
      | /admin/metricas                                                 |
      | /admin/ai-scraping                                              |
      | /admin/ai-scraping/perfiles/00000000-0000-0000-0000-000000000000 |
      | /admin/pipeline                                                 |
      | /admin/pipeline/nueva                                           |
      | /admin/pipeline/00000000-0000-0000-0000-000000000000             |
      | /admin/pipeline/00000000-0000-0000-0000-000000000000/shortlist   |
      | /admin/pipeline/00000000-0000-0000-0000-000000000000/garantia    |
      | /admin/candidatos                                                |
      | /admin/candidatos/00000000-0000-0000-0000-000000000000            |
      | /admin/candidatos/00000000-0000-0000-0000-000000000000/editar     |
      | /admin/candidatos/00000000-0000-0000-0000-000000000000/asignar    |
      | /admin/empresas                                                  |
      | /admin/empresas/00000000-0000-0000-0000-000000000000              |
      | /admin/empresas/00000000-0000-0000-0000-000000000000/service-orders/00000000-0000-0000-0000-000000000000/condiciones |
      | /admin/procesos                                                  |
      | /admin/contratos                                                 |
      | /admin/facturacion                                               |
      | /admin/pagos                                                     |
      | /admin/solicitudes                                               |
      | /admin/solicitudes/00000000-0000-0000-0000-000000000000           |
      | /admin/entrevistas                                               |
      | /admin/entrevistas/00000000-0000-0000-0000-000000000000           |
