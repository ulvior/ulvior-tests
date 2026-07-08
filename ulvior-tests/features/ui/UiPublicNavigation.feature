# language: es
@ui @UiPublicNavigation
Característica: UiPublicNavigation
  Como visitante
  quiero navegar la UI pública
  para dejar evidencia visual de botones, enlaces y resultado.

  Escenario: Landing muestra CTA y permite ir a empleos públicos
    Dado abro la pagina "/"
    Entonces debo ver el texto "Ulvior"
    Y debo ver el texto "Contrata talento TI"
    Cuando hago click en el enlace "Empleos"
    Entonces la URL debe contener "/empleos"
    Y espero que la pagina termine de cargar
