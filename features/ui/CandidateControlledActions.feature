# language: es
@ui @candidate-controlled @CandidateControlledActions
Característica: CandidateControlledActions
  Como QA E2E
  quiero ejecutar acciones controladas del flujo candidato
  para validar formularios, CV, evaluacion AI, coding y persistencia con evidencia UI/backend.

  Escenario: Candidato visualiza datos A-Z creados para procesos y entrevistas
    Dado preparo datos E2E A-Z para todos los flujos
    Dado inicio sesion como "candidato"
    Cuando navego a la pantalla autenticada "/candidato/procesos"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Procesos|E2E-20260713-ULVIOR-QA-001|QA"
    Cuando navego a la pantalla autenticada "/candidato/entrevistas"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y la pantalla debe mostrar al menos uno de estos textos "Mis entrevistas|Confirmar asistencia|Proponer horario|Con Ulvior|cliente"
    Cuando hago click en la accion visible "Proponer horario"
    Entonces la pantalla debe mostrar al menos uno de estos textos "Proponer horario|Horario 1|Enviar horarios"
    Cuando hago click en la accion visible "Cancelar"
    Entonces la pantalla autenticada debe renderizar sin errores

  Escenario: Candidato carga CV, lo analiza, edita perfil y conserva documentos
    Dado inicio sesion como "candidato"
    Cuando navego a la pantalla autenticada "/candidato/perfil"
    Entonces la pantalla autenticada debe renderizar sin errores
    Cuando subo el CV fixture candidato "cv-e2e-ulvior-candidato.pdf"
    Entonces backend candidato debe conservar CV disponible
    Cuando analizo el CV desde UI si esta pendiente
    Entonces backend candidato debe conservar CV disponible y analizado
    Cuando navego a la pantalla autenticada "/candidato/perfil/editar"
    Entonces la pantalla autenticada debe renderizar sin errores
    Cuando completo el campo con name "empresa_actual" con "Ulvior QA E2E"
    Y completo el campo con name "años_experiencia" con "5"
    Cuando completo el campo con name "resumen" con "Resumen actualizado por E2E-20260713-ULVIOR-QA-001 sin tocar CV"
    Y completo el campo con name "expectativa_salarial" con "3500"
    Y completo el campo con name "linkedin" con "https://linkedin.com/in/e2e-ulvior-candidato"
    Y completo el campo con name "github" con "https://github.com/ulvior/e2e-candidato"
    Y relleno campos obligatorios generados desde CV si estan vacios
    Y completo el campo con name "experiencia.0.empresa" con "Ulvior QA E2E"
    Y guardo el perfil candidato desde UI
    Entonces backend perfil candidato debe contener "Resumen actualizado por E2E-20260713-ULVIOR-QA-001"
    Y backend candidato debe conservar CV disponible y analizado
    Cuando navego a la pantalla autenticada "/candidato/perfil"
    Entonces la pantalla debe mostrar al menos uno de estos textos "Documentos|Curriculum Vitae|cv-e2e-ulvior-candidato.pdf"
    Cuando navego a la pantalla autenticada "/candidato/evaluacion-ai"
    Entonces la pantalla autenticada debe renderizar sin errores
    Y backend evaluacion AI candidato debe responder 200 y reconocer CV
    Y la consola del navegador no debe tener errores severos

  Escenario: Candidato ejecuta coding desde navegador y backend persiste ejecucion
    Dado inicio sesion como "candidato"
    Cuando navego a la pantalla autenticada "/candidato/evaluacion-coding"
    Entonces la pantalla autenticada debe renderizar sin errores
    Cuando cargo una solucion JavaScript valida en el editor coding
    Y ejecuto el codigo candidato desde UI
    Entonces backend coding candidato debe tener ejecucion exitosa
    Cuando evaluo el codigo candidato con IA si esta habilitado
    Y candidato responde todas las preguntas tecnicas coding por backend
    Entonces backend candidato debe tener evidencia coding completa y score comercial
    Entonces la pantalla autenticada debe renderizar sin errores
    Y backend evaluacion AI candidato debe responder 200 y reconocer CV
    Cuando navego a la pantalla autenticada "/candidato/evaluacion-coding"
    Entonces la pantalla debe mostrar al menos uno de estos textos "Preguntas|Resultados|Score|Evaluación"
    Y la consola del navegador no debe tener errores severos
