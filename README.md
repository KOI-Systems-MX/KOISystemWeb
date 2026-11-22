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

- Estanque de acuarela con koi articulados y lotos.
- Texto e interfaces bajo la superficie del agua, con koi nadando por toda la portada.
- Transformación de cola en código con estelas locales, cortas y efímeras. No hay transferencias de partículas desde peces lejanos hacia el prototipo.
- Cuatro productos ilustrativos: punto de venta, picking en embarcaciones, inventario multialmacén y gestión administrativa. Los cruces de los koi pueden detonar sus transiciones.
- Pausa, reconstrucción, vista estática y respeto de `prefers-reduced-motion`.
- Sección Nosotros con identidad institucional estática. El video queda fuera de esta entrega de desarrollo.

Los productos y datos del prototipo son ilustrativos. El formulario final descarga una descripción del proyecto en el dispositivo; no envía información. Se incluyen las ilustraciones de Nelumbo y la identidad visual necesarias para ejecutar la landing. El archivo `assets/brand/provenance.json` documenta la integridad del logotipo original.

No se incluyen videos, respaldos, capturas de revisión ni registros locales. El componente de cierre de video conserva su código y pruebas unitarias para futuras integraciones autorizadas. La copia local original con el video se mantiene aparte de este repositorio.
