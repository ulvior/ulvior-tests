# language: es
@ui @ConsentimientosUi @privacy
Característica: ConsentimientosUi
  Como QA
  quiero validar visualmente los consentimientos en registros públicos
  para asegurar que candidato y empresa no avancen sin aceptar las condiciones requeridas.

  Escenario: Registro de candidato muestra consentimientos y bloquea sin aceptar los obligatorios
    Dado abro la pagina "/registro/candidato"
    Entonces debo ver el texto "Crear cuenta"
    Cuando completo el input "Nombre completo" con "QA Consentimiento Candidato"
    Y completo el input "Email" con "qa.ui.candidato.{{E2E_RUN_ID}}@ulvior.test"
    Y completo el input "Contraseña" con "Candidate123!"
    Y completo el input "Confirmar contraseña" con "Candidate123!"
    Y hago click en el boton "Continuar"
    Entonces debo ver checkbox asociado al texto "Términos y Condiciones"
    Y debo ver checkbox asociado al texto "Política de Privacidad"
    Y debo ver checkbox asociado al texto "perfil será evaluado con inteligencia artificial"
    Y debo ver checkbox asociado al texto "recibir novedades y oportunidades laborales"
    Cuando selecciono la opcion visible "Backend Engineer"
    Y selecciono la opcion visible "Node.js"
    Y selecciono la opcion visible "3–5 años"
    Y hago click en el boton "Crear cuenta gratis"
    Entonces debo ver el texto "Debes aceptar los Términos y Condiciones y la Política de Privacidad"
    Y la URL no debe contener "/verificar-email"

  Escenario: Registro de empresa muestra términos del contacto y bloquea sin aceptar
    Dado genero una invitacion UI de empresa
    Y abro el registro de empresa generado para UI
    Entonces debo ver el texto "Registro de empresa"
    Y debo ver checkbox asociado al texto "aplicables al contacto de empresa"
    Cuando completo el input "Nombre de la empresa" con "Empresa SpA UI Privacy"
    Y completo el input "Nombre de contacto" con "QA Contacto Empresa"
    Y completo el input "Contraseña" con "Empresa123!"
    Y completo el input "Confirmar contraseña" con "Empresa123!"
    Y hago click en el boton "Activar cuenta"
    Entonces debo ver el texto "Debes aceptar los Términos y la Política de Privacidad"
    Y la URL no debe contener "/verificar-email"
