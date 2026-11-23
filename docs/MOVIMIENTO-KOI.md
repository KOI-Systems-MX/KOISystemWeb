# Natación, formación y estela de los KOI

Implementación local, sin dependencias nuevas ni publicación.

## Revisión previa

La escena combina Canvas 2D para ilustraciones y partículas con el material de agua WebGL2 y su alternativa Canvas. El controlador es `dist/koi.js`; `dist/swimming.js` conserva el historial de la trayectoria de cada cabeza, steering, velocidad y límites. La formación se define en `dist/formation.js`, la erosión caudal en `dist/tail-dissolution.js` y las estelas en `dist/local-tail-scene.js`. El ensamblaje del software permanece en `dist/component-construction.js`.

Se estudió [el código de referencia](https://github.com/madebysourasith-sudo/koi-login/blob/main/index.html), especialmente su espina basada en trayectoria, la onda creciente hacia la cola y las aletas con ritmos separados. Se reutilizaron principios generales de animación; no se incorporó su código, sus shaders, su diseño ni sus recursos gráficos. Se mantienen las ilustraciones originales de Nelumbo y la identidad de KOI Systems.

Los problemas corregidos fueron la geometría duplicada entre cuerpo y emisión, las aletas integradas en tiras rígidas y una fuerza vertical que alejaba la estela de la trayectoria. No era necesario reemplazar la simulación completa.

## Decisiones

- `anatomyPoint` es la geometría compartida de pigmento, caracteres de formación y puertos de emisión. La cabeza dirige el historial; la onda aumenta hacia la cola.
- La malla usa 32 columnas, tres bandas laterales y un buffer reutilizable. En móvil baja a 24 columnas. Las aletas pectorales tienen fases distintas y una respuesta discreta al giro; la dorsal posee otra frecuencia.
- `EMERGING`, `ASSEMBLING` y `SWIMMING` describen un flujo continuo. Cambiar de estado no reinicia posición, velocidad, fase ni estela. No se añade una disolución periódica del pez completo.
- La cola está erosionada desde su primera aparición. Los signos adheridos y los desprendidos nacen de coordenadas del pigmento original.
- Cada emisión mide la velocidad de sus puntos caudales respecto al fotograma anterior. Los caracteres heredan parte de ese desplazamiento y oscilación, conservan inercia y se dispersan transversalmente. No hay gravedad vertical ni retargeting al girar.
- Se reciclan objetos de partículas. La estela mantiene límites de vida, alcance y cantidad; solo la cola cercana puede aportar fragmentos al prototipo, conservando su procedencia.
- El pigmento original y la frontera de materialización por píxel se calculan una sola vez por lienzo. Cada actualización reutiliza esos datos y modifica únicamente el alfa, evitando recalcular la ilustración completa durante la formación.
- Se preservan los límites, la separación, las aceleraciones suaves y los recorridos autónomos. Se añaden desaceleraciones pequeñas con fase individual.
- La superficie de agua sigue por encima de las ilustraciones e interfaz. No se modifican la paleta azul y naranja, las plantas, el logotipo ni las secciones posteriores.

## Parámetros ajustables

| Parámetro | Ubicación | Valor |
| --- | --- | --- |
| Columnas / bandas | `koi.js`, `drawFish` | 32 / 3; móvil 24 / 3 |
| Onda caudal | `swimming.js`, `anatomySection` | amplitud máxima 0.038 de la longitud |
| Ritmo de aletas | `swimming.js` | fase integrada según velocidad; desfase izquierda/derecha |
| Desaceleración individual | `swimming.js`, `rest` | hasta 17 % |
| Caché de pigmento erosionado | `koi.js` | 8 actualizaciones/s |
| Resolución de pigmento / signos de formación | `koi.js` | 222×148; móvil 144×96 y menor densidad de signos |
| Emisión | `local-tail-scene.js` | dos caracteres cada 0.26 s por koi |
| Vida / alcance de estela | `local-tail-scene.js` | 1.05–1.29 s; máximo 64 px |
| Cantidad | `local-tail-scene.js` | máximo 12 por koi, 64 totales |
| Inercia heredada / amortiguación | `local-tail-scene.js` | 28 % de velocidad caudal; 1.8/s |
| Construcción cercana | `component-construction.js` | cola a 48 px o menos; cuatro transferencias simultáneas |
| Integración / dibujo | `swimming.js` / `koi.js` | subpasos hasta 1/60 s; dibujo hasta 30 fps |

## Validación

Las pruebas cubren equivalencia entre malla y puntos caudales, fases independientes de aletas y simetría de una estela al rotar su trayectoria 90 grados (sin eje vertical privilegiado). También se mantienen las comprobaciones de formación en movimiento, límites, redimensionado, pausa, reconstrucción, movimiento reducido, identidad original y construcción de los cuatro productos.

Revisión visual local en escritorio y móvil: formación en movimiento, cola fragmentada continua, prototipo sumergido, hojas, controles y vista estática. El coste de dibujo se observa mediante `data-paint-ms`; es una muestra de esta computadora, no una garantía para todos los dispositivos.
