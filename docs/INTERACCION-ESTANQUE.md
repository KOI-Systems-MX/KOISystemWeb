# Interacción hidrodinámica y comportamiento reactivo

Implementación local sin nuevas dependencias ni servicios externos.

## Revisión y arquitectura

Se revisaron la detección de velocidad, las ondas y la reacción de los peces en [la referencia técnica](https://github.com/madebysourasith-sudo/koi-login/blob/main/index.html). Se conserva una implementación propia; no se incorporaron su diseño, recursos ni código.

Antes existía únicamente una onda al pulsar, sin reacción de los koi. Ahora `dist/hydrodynamics.js` separa los eventos de entrada, las perturbaciones visuales y las fuerzas de comportamiento. `dist/koi.js` conecta eventos pasivos de puntero y el reloj de la escena; `dist/swimming.js` aplica las fuerzas sin sustituir las trayectorias articuladas.

`dist/pond-water.js` y `dist/vegetation.js` comparten la expansión de las ondas. `dist/tail-dissolution.js` transmite el esfuerzo a `dist/local-tail-scene.js`, que adapta discretamente inercia, duración y alcance de la estela. Se mantienen sus límites de cantidad y la contribución al prototipo solo desde colas próximas.

## Entrada y prioridades

- Un contacto breve se confirma al levantar el puntero: pulsar y arrastrar no se interpreta como un clic quieto.
- La velocidad del mouse se filtra en píxeles por segundo y se normaliza según el tamaño del estanque. Un movimiento rápido puede emitir una perturbación sin `pointerdown` ni `click`.
- Hay histéresis, separación espacial y periodo mínimo entre perturbaciones. No se crea una onda por cada evento.
- Los toques breves generan ondas suaves. El movimiento táctil no genera amenazas y no cancela el desplazamiento de la página.
- Botones, enlaces, etiquetas de formulario, campos, desplegables y diálogos quedan excluidos. No se llama a `preventDefault` ni se captura el puntero táctil.
- Pausar congela el reloj y descarta entrada nueva. El movimiento reducido limpia perturbaciones y respuestas. Reconstruir reinicia todo el sistema.

## Estados independientes de la formación

| Estado | Condición / comportamiento |
| --- | --- |
| WANDERING | Exploración normal |
| CURIOUS | Onda suave percibida, con personalidad y distancia favorables |
| INSPECTING | Cercanía al punto de interés; aproximación curva y giro de exploración |
| STARTLED | Perturbación fuerte percibida; prioridad sobre curiosidad |
| FLEEING | Alejamiento con aceleración, mayor frecuencia corporal y esfuerzo caudal |
| RECOVERING | Desaceleración y reducción gradual del esfuerzo antes de explorar de nuevo |

La propagación y el retardo individual impiden que todos los peces reaccionen a la vez. La distancia limita la percepción: un movimiento lejano no obliga a huir a todo el grupo. Cada perturbación se procesa una vez por pez. Un estímulo nuevo puede interrumpir la curiosidad.

Los límites atenúan las fuerzas reactivas y la aceleración; se conservan los límites de giro existentes. La formación `EMERGING / ASSEMBLING / SWIMMING` continúa en paralelo: un pez incompleto también puede reaccionar, sin reiniciar posición, fase o código.

## Parámetros

Los umbrales de entrada están centralizados en `HYDRO_DEFAULTS` y las variaciones individuales en `koiPersonality`, dentro de `dist/hydrodynamics.js`.

| Parámetro | Valor base |
| --- | --- |
| Movimiento lento / brusco | 180 / 1100 px/s |
| Umbral de rearme | 580 px/s |
| Filtro temporal | 0.055 s |
| Intervalo / separación de perturbaciones | 0.45 s / 44 px |
| Toque breve | Hasta 0.45 s y 8 px de desplazamiento |
| Perturbaciones activas | Máximo 8, con objetos reutilizados |
| Vida de curiosidad / onda brusca | 7 / 3.2 s |
| Propagación de percepción | 220 px/s |
| Recuperación individual | 3–5 s |
| Velocidad máxima individual de huida | 1.5–1.85 veces la habitual, atenuada cerca de límites |
| Cambio máximo de velocidad reactiva | Aumento 1.8 y descenso 1.5 veces la velocidad de crucero por segundo |
| Estela durante huida | Hasta 76 px y 1.54 s; máximo 12 caracteres por koi / 64 totales |

Los valores de entrada y alcance se escalan para pantallas pequeñas. El redimensionado conserva el tiempo y recoloca ondas y puntos de interés, limpiando la muestra anterior del cursor.

## Pruebas realizadas

- Pruebas de contacto suave, ondas concéntricas, percepción cercana, curiosidad e inspección.
- Movimiento rápido sin pulsación: prueba del controlador puro y de los manejadores `pointermove` reales de la escena, incluso durante la formación del koi.
- Sobresalto con prioridad, huida, recuperación, límites, continuidad de posición y respuesta corporal.
- Jitter, muestras antiguas, histéresis, muestreo espacial, límites de cantidad y personalidades reproducibles.
- Toque frente a desplazamiento táctil, controles excluidos, redimensionado y limpieza para movimiento reducido.
- Suite existente de formación, colas, prototipos, identidad, pausa y renderizadores.

En el navegador se ejecutaron clics quietos y desplazamientos mediante arrastre: se observaron ondas, un koi `CURIOUS`, un koi `STARTLED / FLEEING` mientras los lejanos permanecían `WANDERING`, y después `RECOVERING → WANDERING`. La prueba visual de desplazamiento usó arrastre; el caso de mouse sin pulsar y los gestos táctiles se verificaron automáticamente, no con un dispositivo táctil físico.
