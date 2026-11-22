const tag=(text,type='')=>`<span class="product-tag ${type}">${text}</span>`;
const heading=(kicker,title,extra)=>`<header class="product-heading" data-build-group="1"><small>${kicker}</small><div><h3>${title}</h3>${extra||''}</div></header>`;

export const products=[
  {id:'pos',name:'Punto de venta',html:
    heading('CAJA 03 · SUCURSAL CENTRO','Punto de venta',tag('En línea'))+
    `<div class="pos-workspace">
      <section class="pos-catalog" data-build-group="2"><div class="mock-search">⌕ Buscar producto o código</div><div class="category-line"><b>Todos</b><span>Oficina</span><span>Accesorios</span></div><div class="catalog-grid">
      <article><i>▤</i><b>Cuaderno A5</b><span>$ 120.00</span></article><article><i>◉</i><b>Termo 600 ml</b><span>$ 349.00</span></article><article><i>▣</i><b>Organizador</b><span>$ 225.00</span></article><article><i>✎</i><b>Set de escritura</b><span>$ 179.00</span></article></div><div class="catalog-stock">● Existencias sincronizadas</div></section>
      <section class="pos-ticket" data-build-group="3"><div class="ticket-title"><b>Venta #0148</b><span>3 artículos</span></div><div class="ticket-item"><b>Termo 600 ml</b><span>2 × $349</span><strong>$698</strong></div><div class="ticket-item"><b>Organizador</b><span>1 × $225</span><strong>$225</strong></div><div class="ticket-item"><b>Set de escritura</b><span>1 × $179</span><strong>$179</strong></div><div class="ticket-total"><small>Total a pagar</small><strong>$1,102.00</strong></div><span class="mock-button">Cobrar venta</span></section>
    </div><footer class="product-bottom" data-build-group="4"><span>Cliente: Público general</span><b>↗ Historial de ventas</b></footer>`},
  {id:'picking',name:'Picking en embarcaciones',html:
    heading('OPERACIÓN NAVAL · ORDEN PK-084','Picking a bordo',tag('En curso','orange'))+
    `<div class="voyage-strip" data-build-group="2"><div><small>EMBARCACIÓN</small><b>Aurora · Muelle 02</b></div><div><small>SALIDA</small><b>14:30 h</b></div></div>
    <div class="picking-workspace"><section class="deck-module" data-build-group="3"><div class="module-label">Ruta de recolección</div><div class="ship-plan"><span class="ship-bow">PROA</span><div class="deck-zone completed"><b>01</b><span>Bodega A</span><i>✓</i></div><div class="deck-zone current"><b>02</b><span>Bodega B</span><i>●</i></div><div class="deck-zone"><b>03</b><span>Popa · C-04</span><i>○</i></div></div><div class="route-key"><i></i> Recorrido asignado</div></section>
    <section class="pick-list" data-build-group="4"><div class="module-label">Lista de picking</div><article class="done"><span>✓</span><div><b>Cabos de amarre</b><small>A-02 · 8 / 8 piezas</small></div></article><article class="active"><span>02</span><div><b>Chalecos salvavidas</b><small>B-03 · 12 / 16 piezas</small></div></article><article><span>03</span><div><b>Kit de mantenimiento</b><small>C-04 · 0 / 2 piezas</small></div></article><div class="pick-progress"><b>67 % recolectado</b><i><em></em></i></div><span class="mock-button">Confirmar ubicación</span></section></div>
    <footer class="product-bottom" data-build-group="4"><span>Responsable: Lucía M.</span><b>2 ubicaciones pendientes</b></footer>`},
  {id:'inventory',name:'Inventario multialmacén',html:
    heading('CONTROL DE EXISTENCIAS','Inventario multialmacén',tag('4 almacenes'))+
    `<div class="inventory-kpis" data-build-group="2"><article><small>Existencias totales</small><strong>8,420</strong><span>Unidades disponibles</span></article><article><small>Bajo mínimo</small><strong class="orange-text">23</strong><span>Reposición sugerida</span></article><article><small>En tránsito</small><strong>186</strong><span>Entre almacenes</span></article></div>
    <section class="stock-matrix" data-build-group="3"><div class="matrix-toolbar"><b>Disponibilidad por ubicación</b><span>⌕ Filtrar SKU</span></div><table><thead><tr><th>Producto / SKU</th><th>Central</th><th>Norte</th><th>Muelle</th></tr></thead><tbody><tr><td><b>Válvula 3/4”</b><small>VAL-034</small></td><td>148</td><td>52</td><td>24</td></tr><tr><td><b>Guante industrial</b><small>GUA-018</small></td><td>320</td><td>86</td><td><em>8</em></td></tr><tr><td><b>Cinta de seguridad</b><small>CIN-006</small></td><td>95</td><td>41</td><td>36</td></tr><tr><td><b>Kit de herramientas</b><small>KIT-012</small></td><td>67</td><td>29</td><td>18</td></tr></tbody></table></section>
    <section class="transfer-strip" data-build-group="4"><div><small>ÚLTIMO TRASPASO · TR-052</small><b>Central <span>→</span> Muelle 02</b></div><span class="product-tag orange">En tránsito</span></section>`},
  {id:'admin',name:'Gestión administrativa',html:
    heading('FINANZAS Y OPERACIÓN','Gestión administrativa',tag('Este mes'))+
    `<div class="admin-kpis" data-build-group="2"><article><small>Ingresos</small><strong>$248,500</strong><span>↗ 12.8 % vs. mes anterior</span></article><article><small>Por cobrar</small><strong>$36,200</strong><span>8 facturas abiertas</span></article></div>
    <section class="finance-chart" data-build-group="3"><div class="matrix-toolbar"><b>Ingresos y gastos</b><span><i></i> Ingresos <em></em> Gastos</span></div><svg viewBox="0 0 360 130" preserveAspectRatio="none" aria-hidden="true"><path class="chart-grid" d="M24 20H348M24 58H348M24 96H348"/><path class="income-area" d="M24 92L78 76L132 83L186 44L240 56L294 29L348 16V112H24Z"/><path class="income-line" d="M24 92L78 76L132 83L186 44L240 56L294 29L348 16"/><path class="expense-line" d="M24 101L78 96L132 89L186 94L240 75L294 81L348 65"/><g><text x="22" y="128">ENE</text><text x="76" y="128">FEB</text><text x="130" y="128">MAR</text><text x="184" y="128">ABR</text><text x="238" y="128">MAY</text><text x="292" y="128">JUN</text></g></svg></section>
    <section class="approval-list" data-build-group="4"><div class="matrix-toolbar"><b>Pendientes de aprobación</b><span>3 solicitudes</span></div><article><div><b>Compra de suministros</b><small>Área de operaciones</small></div><strong>$4,850</strong><span class="product-tag orange">Revisar</span></article><article><div><b>Conciliación bancaria</b><small>Cuenta operativa · 94 %</small></div><i class="reconciliation"><em></em></i><span class="product-tag">Al día</span></article></section>`},
];

export function mountProduct(root,index){const p=products[index%products.length];root.innerHTML=p.html;root.dataset.product=p.id;return p;}

export function captureProductSlots(window){
  const outer=window.getBoundingClientRect(),slots=[];
  for(let i=0;i<44;i++){slots.push({u:.02+i*.96/43,v:.015,group:0},{u:.02+i*.96/43,v:.985,group:0});}
  for(let i=1;i<54;i++)slots.push({u:.02,v:i/54,group:0},{u:.98,v:i/54,group:0});
  for(const group of [1,2,3,4]){
    const nodes=[...window.querySelectorAll(`[data-build-group="${group}"]`)];
    for(const node of nodes){
      const r=node.getBoundingClientRect();
      const columns=Math.max(2,Math.ceil(r.width/10)),rows=Math.max(2,Math.ceil(r.height/9));
      for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
        const u=(r.left-outer.left+r.width*(column+.5)/columns)/Math.max(1,outer.width);
        const v=(r.top-outer.top+r.height*(row+.5)/rows)/Math.max(1,outer.height);
        slots.push({u:Math.max(.015,Math.min(.985,u)),v:Math.max(.015,Math.min(.985,v)),group});
      }
    }
  }return slots;
}

export function createProductDirector({minimumDwell=16,cooldown=8}={}){
  let index=0,inside=new Set(),visibleSince=null,lastSwitch=-Infinity,pending=false,transitioning=false;
  return {
    get index(){return index;},
    reset(){index=0;inside.clear();visibleSince=null;lastSwitch=-Infinity;pending=transitioning=false;},
    observe(time,fish,zone,ready){
      const next=new Set();let entered=false;
      for(const f of fish){if(f.x>=zone.left&&f.x<=zone.right&&f.y>=zone.top&&f.y<=zone.bottom){next.add(f.id);if(!inside.has(f.id)&&f.speed>1)entered=true;}}
      inside=next;
      if(transitioning)return false;
      if(ready&&visibleSince===null)visibleSince=time;
      if(ready&&entered)pending=true;
      if(pending&&ready&&time-visibleSince>=minimumDwell&&time-lastSwitch>=cooldown){pending=false;transitioning=true;return true;}
      return false;
    },
    complete(time){if(!transitioning)return index;index=(index+1)%products.length;visibleSince=null;lastSwitch=time;pending=false;transitioning=false;return index;},
  };
}
