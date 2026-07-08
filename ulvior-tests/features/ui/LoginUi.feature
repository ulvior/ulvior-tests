# language: es
@ui @LoginUi
Característica: LoginUi
  Como usuario
  quiero evidenciar inputs y botones del login
  para auditar el paso a paso visual de autenticación.

  Escenario: Login captura email, password y boton de envio
    Dado abro el login
    Entonces debo ver el texto "Ulvior"
    Y debo ver el boton "Iniciar sesión"
    Cuando completo el input "Email" con "{{TEST_ADMIN_EMAIL}}"
    Y completo el input "Contraseña" con "{{TEST_ADMIN_PASSWORD}}"
    Y hago click en el boton "Iniciar sesión"
    Entonces espero que la pagina termine de cargar

  Escenario: Ruta protegida redirige a login cuando no hay sesión
    Dado abro la pagina "/admin/dashboard"
    Entonces la URL debe contener "/login"
    Y debo ver el boton "Iniciar sesión"
