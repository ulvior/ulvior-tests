# language: es
@ui @WebEmpresaRoutes @regression
Característica: WebEmpresaRoutes
  Como QA
  quiero cubrir todas las rutas del portal empresa
  para validar redirección segura sin sesión y evidencia visual.

  Esquema del escenario: Ruta empresa protegida redirige a login
    Dado abro la pagina "<ruta>"
    Entonces la URL debe contener "/login"
    Y debo ver el boton "Iniciar sesión"

    Ejemplos:
      | ruta                                                            |
      | /empresa/dashboard                                              |
      | /empresa/analytics                                              |
      | /empresa/busquedas                                              |
      | /empresa/busquedas/nueva                                        |
      | /empresa/busquedas/historial                                    |
      | /empresa/busquedas/00000000-0000-0000-0000-000000000000          |
      | /empresa/busquedas/00000000-0000-0000-0000-000000000000/shortlist |
      | /empresa/busquedas/00000000-0000-0000-0000-000000000000/candidato/00000000-0000-0000-0000-000000000000 |
      | /empresa/busquedas/00000000-0000-0000-0000-000000000000/entrevistas |
      | /empresa/profesionales                                          |
      | /empresa/profesionales/00000000-0000-0000-0000-000000000000      |
      | /empresa/profesionales/00000000-0000-0000-0000-000000000000/solicitar |
      | /empresa/mis-solicitudes                                        |
      | /empresa/entrevistas                                            |
      | /empresa/perfil                                                 |
      | /empresa/cuenta-facturacion                                     |
      | /empresa/cuenta-facturacion/service-orders/00000000-0000-0000-0000-000000000000/condiciones |
