# language: es
@api @NotificationsApi @regression
Característica: NotificationsApi
  Como QA
  quiero cubrir notificaciones desde API
  para validar seguridad, paginación y acciones de lectura sin filtrar datos entre usuarios.

  Esquema del escenario: Endpoints de notificaciones rechazan acceso sin sesión
    Dado que uso el servicio "api"
    Cuando envio <metodo> a "<ruta>" sin JSON
    Entonces el status HTTP debe ser uno de "401, 403"

    Ejemplos:
      | metodo | ruta                                                  |
      | GET    | /notificaciones                                      |
      | GET    | /notificaciones?limit=20&offset=0                    |
      | GET    | /notificaciones?limit=100&offset=0                   |
      | PATCH  | /notificaciones/00000000-0000-0000-0000-000000000000/leida |

  Escenario: Marcar como leída una notificación ajena no debe exponerse sin credenciales
    Dado que uso el servicio "api"
    Cuando envio PATCH a "/notificaciones/00000000-0000-0000-0000-000000000000/leida" sin JSON
    Entonces el status HTTP debe ser uno de "401, 403"
