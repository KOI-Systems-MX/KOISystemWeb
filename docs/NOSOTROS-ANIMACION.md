# Presentación de Nosotros

Reinterpretación con código del video local de WhatsApp (16.67 segundos). Se revisaron fotogramas entre 0 y 16 segundos: KOI horizontal, separación vertical con una onda, Kaizen, Kernel / Operaciones / Innovación, Kinetic / Operational / Intelligence y KOI Systems. La nueva secuencia dura 18.9 segundos y termina con el logotipo oficial intacto. No se incorpora el MP4, audio ni fotogramas a los recursos de la landing.

- `dist/identity-motion.js`: reloj único, composición tipográfica SVG y materialización con código en Canvas. Secuencia finita; conserva el cierre hasta pulsar repetir. Pausa al salir de la sección o cambiar de pestaña y no acumula tiempo oculto.
- `dist/identity-motion.css`: animación transparente integrada al fondo de Quiénes somos, tipografía, controles y adaptación móvil.
- `dist/index.html`: montaje en Nosotros, controles y texto desplegable accesible con el significado de las palabras.
- `tests/identity-motion.test.mjs`: orden narrativo, continuidad de letras, reinicio determinista y cierre sin logotipo prematuro.

No hay bibliotecas nuevas ni servicios remotos. Se limita la densidad de partículas y la resolución del Canvas. Con movimiento reducido se muestra el cierre sin programar fotogramas y se abre la explicación textual; sin JavaScript permanece disponible el logotipo y la explicación. El texto lateral de Nosotros y el estanque conservan su comportamiento.

Validación: la suite completa pasó 64 pruebas; se añadió después una cuarta prueba específica del controlador y sus cuatro pruebas pasaron. Esta última ejecuta el reloj real con fotogramas espaciados, pausa/reanudación, salida de pantalla, repetición, cierre y cambio a movimiento reducido. Se comprobaron 50 referencias locales. En el navegador se observaron KOI, Kaizen, Kernel / Operaciones / Innovación, pausa y reanudación; se verificó el estado de cierre y la repetición. En móvil se corrigió y comprobó la ausencia de desbordamiento horizontal. No se alteraron los archivos originales del logotipo.

## Integración sin marco

Se eliminan el relleno rectangular del Canvas, el fondo propio del escenario y del cierre, los bordes y las sombras. El azul marino pertenece únicamente a la sección. Los caracteres `0`, `1`, `{`, `}`, `<`, `>` convergen hacia destinos muestreados de los píxeles de cada letra y de la imagen oficial; al llegar materializan pequeñas celdas de tinta, que dan paso a la forma limpia. El cierre utiliza el símbolo oficial transparente sin modificar sus colores ni píxeles y el nombre en tipografía clara. No lleva halo, fondo marfil ni tarjeta.

La rasterización de palabras se guarda en caché. Solo se dibujan caracteres durante la construcción de cada elemento; desaparecen en el resultado final. Se mantiene la secuencia de significados del video, con un reloj de 18.9 segundos que pasa directamente al logotipo. Se añadió una prueba de destinos dentro de la silueta, continuidad cromática del recurso, ausencia de KOI premontado y limpieza de caracteres al completar. Pasan las siete pruebas de presentación e identidad. En navegador se observaron la fase de código, la construcción de palabras y el cierre; se confirmó fondo transparente, borde cero y sombra inexistente. En móvil el cierre cabe en 340 px y no hay desbordamiento horizontal.

## Refinamiento tipográfico

Un único encabezado «01 / Quiénes somos» sustituye los dos títulos repetidos. La composición usa un lienzo lógico de 800 × 540, iniciales de 160 px y palabras de 76 px con peso 800. Sus centros de tinta se alinean calculando el ascenso y descenso reales de cada texto, compartidos por SVG y partículas; así los descendentes de Operational e Intelligence no desajustan las filas. Se añadió una prueba de alineación con tamaños distintos y descendentes. En navegador se revisaron las tres filas ampliadas y el símbolo final sobre azul marino sin fondo blanco, y se comprobó que el cierre móvil conserva todo su contenido dentro de 340 px sin desbordamiento horizontal.

## Corrección del encabezado y del cierre

Se restaura el encabezado pequeño «01 / QUIÉNES SOMOS», en 9 px y con el mismo tratamiento de las etiquetas de sección. Se elimina por completo el texto SVG independiente «KOI Systems» y su fase de construcción. Tras Kinetic / Operational / Intelligence comienza directamente el cierre de identidad a los 13.9 s; termina a los 18.9 s. El nombre permanece únicamente junto al símbolo del cierre. Se mantienen el tamaño y la alineación de las letras, el fondo transparente y los controles. Pasan ocho pruebas de presentación e identidad y las 53 referencias locales. En navegador se verificaron el encabezado pequeño, la ausencia del SVG eliminado y el estado final a los 18.9 s.

## Construcción final más gradual

El cierre comienza a los 13.9 segundos y dedica cinco segundos a la formación del símbolo, frente a los 1.5 anteriores. `IDENTITY_LOGO_SECONDS` centraliza esta duración. Se estira el reloj de las partículas y las celdas, sin ralentizar las palabras previas. El recurso completo permanece oculto mientras se ensambla el pigmento; se mezcla al final. El nombre, la frase y el enlace del cierre esperan esa misma fase de definición. La presentación termina a los 18.9 s, conservando pausa, repetición y movimiento reducido.

Pasan nueve pruebas de presentación e identidad y 53 referencias locales. Se verificó en navegador una fase parcial al 62 % (17 s), con la imagen completa aún a opacidad cero, y el cierre al 100 % (18.9 s) con el recurso limpio visible. No hubo errores de consola.
