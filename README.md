# KOI Systems

Landing de KOI Systems, empresa de desarrollo de software a medida.

Repositorio de desarrollo: https://github.com/ElizabethFranangel/KOISystemWeb

## Desarrollo local

Requiere Node.js 24. No necesita instalar dependencias ni configurar un backend.

```sh
npm run dev
```

Abrir http://127.0.0.1:4173/. El servidor solo escucha en la computadora local.

```sh
npm test
node tools/check-site.mjs
```

## Desarrollo y validación

Los archivos de la página están en `dist/`. El flujo `.github/workflows/validate.yml` ejecuta las pruebas y valida las rutas en cada actualización de `main` y solicitud de cambio. No publica la página ni activa GitHub Pages.

Las rutas de recursos son relativas y funcionan bajo `/KOISystemWeb/`. No se requiere proceso de compilación ni claves de acceso en el sitio.

## Experiencia

Los detalles de la cinemática compartida, los parámetros ajustables y la validación están en [docs/MOVIMIENTO-KOI.md](docs/MOVIMIENTO-KOI.md).

La interacción por clic, sobresalto del cursor, personalidades y recuperación se documenta en [docs/INTERACCION-ESTANQUE.md](docs/INTERACCION-ESTANQUE.md). Un clic breve en el agua despierta curiosidad; un movimiento rápido del mouse genera una perturbación para los koi próximos. En táctil, los toques breves interactúan y el desplazamiento de página se conserva.

La paleta digital se centraliza en `dist/brand-palette.css`: marino `#102C46`, acero `#617C94`, naranja `#F16A2B`, naranja profundo `#C94419`, marfil `#F8F7F1` y agua `#DCE8ED`. El texto secundario usa un azul más oscuro para conservar contraste. El material WebGL/Canvas y las estelas comparten matices azulados; los archivos originales del logotipo y la vegetación conservan sus píxeles.

- Estanque de acuarela con koi articulados y lotos.
- Los koi emergen del código mientras nadan: cuerpo y aletas se definen gradualmente, pero su cola nace parcialmente disuelta y emite una estela desde la formación misma. No existe una fase de pez intacto ni una activación posterior de la estela. Los signos de la cola siguen la misma espina articulada que el pigmento y alimentan la construcción local del software. Reconstruir reinicia el flujo; el movimiento reducido muestra directamente la composición final.
- Texto e interfaces bajo la superficie del agua, con koi nadando por toda la portada.
- Transformación de cola en código con estelas locales, cortas y efímeras. No hay transferencias de partículas desde peces lejanos hacia el prototipo.
- La construcción consume fragmentos reales de una cola a menos de 48 píxeles de la ventana. Un solo koi aporta código a la vez, con un máximo de cuatro fragmentos en tránsito. Su llegada alimenta siete etapas de ensamblaje: contorno, superficie, navegación, controles, datos, gráficas y detalles. Máscaras por celdas de la geometría real transforman el código en componentes; no hay un panel terminado detrás de un desvanecimiento. Al finalizar queda la interfaz limpia bajo el agua.
- Cuatro productos ilustrativos: punto de venta, picking en embarcaciones, inventario multialmacén y gestión administrativa. Los cruces de los koi pueden detonar sus transiciones.
- Pausa, reconstrucción, vista estática y respeto de `prefers-reduced-motion`.
- Sección Nosotros con identidad institucional estática. El video queda fuera de esta entrega de desarrollo.

Los productos y datos del prototipo son ilustrativos. El formulario final descarga una descripción del proyecto en el dispositivo; no envía información. Se incluyen las ilustraciones de Nelumbo y la identidad visual necesarias para ejecutar la landing. El archivo `assets/brand/provenance.json` documenta la integridad del logotipo original.

No se incluyen videos, respaldos, capturas de revisión ni registros locales. El componente de cierre de video conserva su código y pruebas unitarias para futuras integraciones autorizadas. La copia local original con el video se mantiene aparte de este repositorio.
