# language: es
@ui @ui-auth @UiRoleSecurity
Característica: UiRoleSecurity
  Como QA
  quiero validar aislamiento visual por rol
  para asegurar que una sesión no pueda navegar portales ajenos.

  Escenario: Candidato no accede a pantallas de admin ni empresa
    Dado inicio sesion como "candidato"
    Cuando navego a la pantalla autenticada "/admin/dashboard"
    Entonces debo quedar bloqueado por seguridad
    Cuando navego a la pantalla autenticada "/empresa/dashboard"
    Entonces debo quedar bloqueado por seguridad

  Escenario: Empresa no accede a pantallas de admin ni candidato
    Dado inicio sesion como "empresa"
    Cuando navego a la pantalla autenticada "/admin/dashboard"
    Entonces debo quedar bloqueado por seguridad
    Cuando navego a la pantalla autenticada "/candidato/home"
    Entonces debo quedar bloqueado por seguridad

  Escenario: Admin mantiene acceso al backoffice y logout limpia sesión
    Dado inicio sesion como "admin"
    Cuando navego a la pantalla autenticada "/admin/dashboard"
    Entonces la pantalla autenticada debe renderizar sin errores
    Cuando cierro sesion desde UI
    Entonces la URL debe contener "/login"
    Y el back button no debe mostrar una pantalla privada
