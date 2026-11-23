# Proyectos y galería del prototipo

La sección existente `#demo` se presenta como «05 / PROYECTOS» y se incorpora a la navegación fija y al indicador de sección activa. El menú se repliega hasta 1200 px para alojar el nuevo enlace sin desbordarse.

Se capturaron cinco pantallas reales, a 1440 × 900, del archivo proporcionado `KOI-Systems-2026-10-30_v2.html`: dashboard, cotizaciones, compras, inventario multialmacén y seguimiento. No son interfaces recreadas. Las capturas están en `dist/assets/projects/`; una copia local del prototipo está en `dist/prototypes/operations/index.html`. Se conserva su identidad AR Care Solutions y su señalización de datos de demostración. No hay backend ni llamadas remotas añadidas.

`dist/projects.js` controla anterior/siguiente, selección por indicadores, teclado, gesto horizontal y diálogo de ampliación. La reproducción automática avanza cada 1000 ms. Título, descripción, imagen y contador se actualizan juntos. El diálogo devuelve el foco al cerrar, permite continuar la galería y ofrece la imagen original. El gesto vertical y los campos de formulario conservan su comportamiento. El ejemplo previo de inventario se conserva en un desplegable.

`dist/projects.css` mantiene los colores de KOI, adapta la galería a móvil y deja crecer la sección al abrir la demostración de inventario. Cerrada, cabe en los 804 px disponibles debajo de la barra en una pantalla de 1440 × 900.

Validación: siete pruebas de galería y navegación aprobadas; cinco capturas diferentes y sus módulos de origen comprobados; 59 referencias locales verificadas. En navegador se probaron avance, selección directa, teclado, ampliación, navegación dentro del diálogo y el ejemplo de apartado (5 disponibles a 2 después de apartar 3).

La suite completa pasó 75 pruebas sin fallos. En móvil se comprobaron el enlace Proyectos, el avance de pantalla y el diálogo de ampliación, sin desbordamiento horizontal. La consola de la landing no mostró errores. El prototipo local se copió byte a byte; su hash y las vistas capturadas constan en `dist/assets/projects/provenance.json`.

## Tarjetas superpuestas y reproducción

La galería se reinterpreta según la referencia proporcionada: cinco interfaces permanentes, una central destacada y vecinas escaladas, desplazadas y atenuadas. Las interfaces se trasladan con transiciones de 450 ms sobre el azul marino original de KOI; conservan las capturas reales sin marcos, rellenos, sombras ni rótulos de tarjeta. Hay anterior/siguiente, contador compacto, pausa/reanudación y cinco indicadores.

La rotación se detiene al pasar el cursor, recibir foco, abrir el diálogo, salir de pantalla, ocultar la pestaña o activar movimiento reducido. Una reanudación explícita vuelve a permitir el avance. El contador no anuncia cambios automáticos constantemente a lectores de pantalla. Las transiciones se suprimen con movimiento reducido.

Pasan seis pruebas específicas: posiciones simétricas, temporizador de 1000 ms y todos sus bloqueos, recursos reales, navegación sincronizada, ampliación y gestos. Se verificaron 63 referencias locales. En navegador se observaron dos avances consecutivos separados por aproximadamente un segundo (936 ms entre observaciones), pausa, selección manual y ampliación. En móvil se comprobaron la composición superpuesta y la ausencia de desbordamiento horizontal.

## Conservación de la identidad de la landing

Se restaura el fondo #102C46, títulos marfil y acentos naranjas. La referencia visual se usa únicamente para la distribución superpuesta. Se retiran los envoltorios decorativos y textos de las tarjetas; la interfaz central aumenta hasta 700 px de ancho y las capturas conservan su proporción completa. El temporizador sigue en 1000 ms. Se comprobaron fondo transparente y borde cero en los contenedores, altura de 804 px en escritorio y ampliación en móvil sin desbordamiento horizontal. Las seis pruebas del carrusel y las 63 referencias locales pasan.

## Galería a la izquierda y descripción a la derecha

Se recupera una composición de dos columnas en escritorio: galería superpuesta (aproximadamente dos tercios) y descripción sincronizada de la pantalla activa a la derecha. Se mantienen fondo marino, interfaces sin tarjetas, temporizador de 1000 ms, pausa y ampliación. Las áreas de título y descripción reservan altura para evitar saltos durante el avance automático. Por debajo de 900 px pasan a una columna con descripción debajo; en móvil se verificó ausencia de desbordamiento horizontal. Las seis pruebas del carrusel y las 63 referencias locales pasan. En navegador se comprobó el cambio de título y descripción al avanzar a Cotizaciones.

El botón «Explorar prototipo» se retiró a petición de la usuaria. La versión lista para GitHub pasó 77 pruebas y la comprobación de 62 referencias locales. El video y las capturas temporales de revisión permanecen excluidos del repositorio.
