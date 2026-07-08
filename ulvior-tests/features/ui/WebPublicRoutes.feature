# language: es
@ui @WebPublicRoutes @regression
Característica: WebPublicRoutes
  Como QA
  quiero cubrir las rutas públicas de la aplicación web
  para validar navegación básica y evidencia visual antes de mover ambiente.

  Esquema del escenario: Ruta pública renderiza sin autenticación
    Dado abro la pagina "<ruta>"
    Entonces espero que la pagina termine de cargar
    Y debo ver el texto "<texto>"

    Ejemplos:
      | ruta                         | texto                  |
      | /                            | Ulvior                 |
      | /login                       | Iniciar sesión         |
      | /unauthorized                | 403                    |
      | /flujos                      | Ulvior                 |
      | /registro/candidato          | Crear                  |
      | /registro/empresa/bdd-code   | invitación             |
      | /verificar-email             | Verificar              |
      | /empleos                     | Empleos                |
