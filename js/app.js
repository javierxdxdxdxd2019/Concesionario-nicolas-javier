/* ═══════════════════════════════════════════
   AUTOADMIN — APP.JS
   Main application logic, routing, tables, modals
═══════════════════════════════════════════ */

/* ─── STATE ──────────────────────────────── */
const State = {
  autos:          [],
  clientes:       [],
  ventas:         [],
  financiamiento: [],
  mantenimiento:  [],
};

/* ─── UTILS ──────────────────────────────── */
const $ = id => document.getElementById(id);

function fmt(n) {
  return Number(n).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtPrice(n) {
  return `<span class="currency">$</span>${fmt(n)}`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' });
}

function colorHex(name) {
  const map = {
    blanco:'#f5f5f5', negro:'#222', rojo:'#e74c3c', azul:'#3498db',
    gris:'#95a5a6', verde:'#27ae60', amarillo:'#f1c40f', plata:'#bdc3c7',
    plateado:'#bdc3c7', naranja:'#e67e22', café:'#8b5e3c', marrón:'#8b5e3c',
  };
  return map[(name||'').toLowerCase()] || '#8fa3b8';
}

/* ─── TOAST ──────────────────────────────── */
function toast(msg, type = 'info') {
  const icons = { success:'✓', error:'✕', warning:'⚠', info:'ℹ' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]||'ℹ'}</span>${msg}`;
  $('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3400);
}

/* ─── LOADING ────────────────────────────── */
function loading(show) {
  $('loadingOverlay').classList.toggle('visible', show);
}

/* ─── ROUTING ────────────────────────────── */
function navigate(section) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const sec = $(`section-${section}`);
  if (sec) sec.classList.add('active');

  const nav = document.querySelector(`[data-section="${section}"]`);
  if (nav) nav.classList.add('active');

  $('breadcrumb-section').textContent =
    section.charAt(0).toUpperCase() + section.slice(1);

  // Close sidebar on mobile
  if (window.innerWidth < 900) $('sidebar').classList.remove('open');
}

/* ─── SIDEBAR TOGGLE ─────────────────────── */
$('menuToggle').addEventListener('click', () => {
  $('sidebar').classList.toggle('open');
});

document.querySelectorAll('.nav-item[data-section]').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    navigate(item.dataset.section);
  });
});

document.querySelectorAll('.btn-link[data-section]').forEach(btn => {
  btn.addEventListener('click', () => navigate(btn.dataset.section));
});

/* ─── DATE ───────────────────────────────── */
function updateDate() {
  const now = new Date();
  $('topbar-date').textContent = now.toLocaleDateString('es-CO', {
    weekday:'short', day:'numeric', month:'short', year:'numeric'
  });
}
updateDate();

/* ─── API STATUS CHECK ───────────────────── */
async function checkApiStatus() {
  const dot  = document.querySelector('.status-dot');
  const text = document.querySelector('.status-text');
  const ok   = await Api.ping();
  if (ok) {
    dot.className  = 'status-dot online';
    text.textContent = 'Conectado';
  } else {
    dot.className  = 'status-dot offline';
    text.textContent = 'Sin conexión';
  }
}

/* ═══════════════════════════════════════════
   LOAD ALL DATA
═══════════════════════════════════════════ */
async function loadAll() {
  loading(true);
  $('btnRefresh').classList.add('spinning');
  try {
    const [a, c, v, f, m] = await Promise.allSettled([
      Api.autos.getAll(),
      Api.clientes.getAll(),
      Api.ventas.getAll(),
      Api.financiamiento.getAll(),
      Api.mantenimiento.getAll(),
    ]);

    State.autos          = a.status === 'fulfilled' ? a.value : [];
    State.clientes       = c.status === 'fulfilled' ? c.value : [];
    State.ventas         = v.status === 'fulfilled' ? v.value : [];
    State.financiamiento = f.status === 'fulfilled' ? f.value : [];
    State.mantenimiento  = m.status === 'fulfilled' ? m.value : [];

    renderAll();
  } catch (e) {
    toast('Error cargando datos del servidor', 'error');
  } finally {
    loading(false);
    $('btnRefresh').classList.remove('spinning');
  }
}

function renderAll() {
  updateBadges();
  renderKPIs();
  renderCharts();
  renderRecentVentas();
  renderTableAutos();
  renderTableClientes();
  renderTableVentas();
  renderTableFin();
  renderTableMant();
  renderVentasStats();
  renderFinStats();
  renderMantStats();
}

/* ─── BADGES ─────────────────────────────── */
function updateBadges() {
  $('badge-autos').textContent    = State.autos.length;
  $('badge-clientes').textContent = State.clientes.length;
  $('badge-ventas').textContent   = State.ventas.length;
  $('badge-fin').textContent      = State.financiamiento.length;
  $('badge-mant').textContent     = State.mantenimiento.length;
}

/* ─── KPIs ───────────────────────────────── */
function renderKPIs() {
  const totalAutos      = State.autos.length;
  const disponibles     = State.autos.filter(a => a.estado === 'disponible').length;
  const vendidos        = State.autos.filter(a => a.estado === 'vendido').length;
  const totalClientes   = State.clientes.length;
  const totalVentas     = State.ventas.length;
  const ingresos        = State.ventas.reduce((s, v) => s + Number(v.precio_venta), 0);
  const financiados     = State.ventas.filter(v => v.forma_pago === 'financiado').length;
  const costoMant       = State.mantenimiento.reduce((s, m) => s + Number(m.costo), 0);
  const mantPendientes  = State.mantenimiento.filter(m => m.estado === 'pendiente').length;

  const kpis = [
    {
      label: 'Autos en Inventario', value: totalAutos, icon: carIcon(),
      color: 'teal', delta: `${disponibles} disponibles`, deltaClass: 'delta-up'
    },
    {
      label: 'Autos Vendidos', value: vendidos, icon: checkIcon(),
      color: 'green', delta: `${((vendidos/Math.max(totalAutos,1))*100).toFixed(0)}% del stock`,
      deltaClass: vendidos > 0 ? 'delta-up' : 'delta-neu'
    },
    {
      label: 'Clientes Registrados', value: totalClientes, icon: usersIcon(),
      color: 'violet', delta: 'Base activa', deltaClass: 'delta-neu'
    },
    {
      label: 'Ventas Realizadas', value: totalVentas, icon: salesIcon(),
      color: 'orange', delta: `${financiados} financiadas`, deltaClass: 'delta-up'
    },
    {
      label: 'Ingresos Totales', value: `$${fmt(ingresos)}`, icon: moneyIcon(),
      color: 'amber', delta: 'COP', deltaClass: 'delta-neu', small: true
    },
    {
      label: 'Costo Mantenimientos', value: `$${fmt(costoMant)}`, icon: toolIcon(),
      color: 'rose', delta: `${mantPendientes} pendientes`,
      deltaClass: mantPendientes > 0 ? 'delta-down' : 'delta-up', small: true
    },
  ];

  $('kpiGrid').innerHTML = kpis.map((k, i) => `
    <div class="kpi-card kpi-${k.color}" style="animation-delay:${i*60}ms">
      <div class="kpi-top">
        <div class="kpi-icon ${k.color}">${k.icon}</div>
        <span class="kpi-delta ${k.deltaClass}">${k.delta}</span>
      </div>
      <div class="kpi-value${k.small ? ' kpi-value--sm' : ''}">${k.value}</div>
      <div class="kpi-label">${k.label}</div>
    </div>
  `).join('');

  // slightly smaller font for price values
  document.querySelectorAll('.kpi-value--sm').forEach(el => {
    el.style.fontSize = '1.35rem';
  });
}

/* ─── CHARTS ─────────────────────────────── */
function renderCharts() {
  Charts.ventasPrecio(State.ventas);
  Charts.formaPago(State.ventas);
  Charts.marcas(State.autos);
  Charts.estadoInventario(State.autos);
  Charts.mantenimientoEstado(State.mantenimiento);
}

/* ─── RECENT VENTAS ──────────────────────── */
function renderRecentVentas() {
  const recent = [...State.ventas].slice(-6).reverse();
  if (!recent.length) {
    $('recentVentas').innerHTML = `<div class="empty-state"><p>No hay ventas registradas aún.</p></div>`;
    return;
  }
  $('recentVentas').innerHTML = `
    <table class="recent-table">
      <thead>
        <tr>
          <th>#</th><th>Cliente</th><th>Auto</th><th>Precio</th><th>Pago</th><th>Fecha</th>
        </tr>
      </thead>
      <tbody>
        ${recent.map(v => `
          <tr>
            <td class="cell-id">#${v.id_venta}</td>
            <td>
              <div class="cell-main">${v.nombres || '—'} ${v.apellidos || ''}</div>
            </td>
            <td>
              <div class="cell-main">${v.marca || '—'} ${v.modelo || ''}</div>
            </td>
            <td class="cell-price">${fmtPrice(v.precio_venta)}</td>
            <td>${badgeFormaPago(v.forma_pago)}</td>
            <td style="color:var(--text-3);font-size:0.82rem">${fmtDate(v.fecha_venta)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/* ═══════════════════════════════════════════
   TABLES
═══════════════════════════════════════════ */

/* ─── AUTOS TABLE ────────────────────────── */
function renderTableAutos(filter = '') {
  const rows = State.autos.filter(a =>
    !filter ||
    [a.marca, a.modelo, a.color, a.anio, a.estado]
      .join(' ').toLowerCase().includes(filter.toLowerCase())
  );

  const html = rows.length ? `
    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th><th>Vehículo</th><th>Año</th><th>Color</th>
          <th>Precio</th><th>Estado</th><th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(a => `
          <tr>
            <td class="cell-id">#${a.id_auto}</td>
            <td>
              <div class="car-chip">
                <div class="car-chip-icon">${carIconSmall()}</div>
                <div>
                  <div class="cell-main">${a.marca} ${a.modelo}</div>
                </div>
              </div>
            </td>
            <td><span class="year-tag">${a.anio}</span></td>
            <td>
              <span class="color-dot" style="background:${colorHex(a.color)}"></span>
              ${a.color || '—'}
            </td>
            <td class="cell-price">${fmtPrice(a.precio)}</td>
            <td>${badgeEstadoAuto(a.estado)}</td>
            <td>
              <div class="actions-cell">
                <button class="action-btn" onclick="openEditAuto(${a.id_auto})" data-tooltip="Editar">
                  ${editIcon()}
                </button>
                <button class="action-btn del" onclick="deleteAuto(${a.id_auto})" data-tooltip="Eliminar">
                  ${trashIcon()}
                </button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="table-footer">
      <span>${rows.length} auto${rows.length !== 1 ? 's' : ''} encontrado${rows.length !== 1 ? 's' : ''}</span>
      <span>${State.autos.filter(a => a.estado === 'disponible').length} disponibles · ${State.autos.filter(a => a.estado === 'vendido').length} vendidos</span>
    </div>
  ` : emptyState('No se encontraron autos.');

  $('tableAutos').innerHTML = html;
}

$('searchAutos').addEventListener('input', e => renderTableAutos(e.target.value));

/* ─── CLIENTES TABLE ─────────────────────── */
function renderTableClientes(filter = '') {
  const rows = State.clientes.filter(c =>
    !filter ||
    [c.nombres, c.apellidos, c.cedula, c.email, c.telefono]
      .join(' ').toLowerCase().includes(filter.toLowerCase())
  );

  const html = rows.length ? `
    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th><th>Nombre</th><th>Cédula</th>
          <th>Teléfono</th><th>Email</th><th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(c => `
          <tr>
            <td class="cell-id">#${c.id_cliente}</td>
            <td>
              <div class="cell-main">${c.nombres} ${c.apellidos}</div>
            </td>
            <td style="font-family:var(--font-display);font-weight:600;font-size:0.82rem">
              ${c.cedula}
            </td>
            <td style="color:var(--text-3)">${c.telefono || '—'}</td>
            <td style="color:var(--text-3);font-size:0.82rem">${c.email || '—'}</td>
            <td>
              <div class="actions-cell">
                <button class="action-btn" onclick="openEditCliente(${c.id_cliente})" data-tooltip="Editar">
                  ${editIcon()}
                </button>
                <button class="action-btn del" onclick="deleteCliente(${c.id_cliente})" data-tooltip="Eliminar">
                  ${trashIcon()}
                </button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="table-footer">
      <span>${rows.length} cliente${rows.length !== 1 ? 's' : ''}</span>
    </div>
  ` : emptyState('No se encontraron clientes.');

  $('tableClientes').innerHTML = html;
}

$('searchClientes').addEventListener('input', e => renderTableClientes(e.target.value));

/* ─── VENTAS TABLE ───────────────────────── */
function renderTableVentas(filter = '') {
  const rows = State.ventas.filter(v =>
    !filter ||
    [v.nombres, v.apellidos, v.marca, v.modelo, v.forma_pago]
      .join(' ').toLowerCase().includes(filter.toLowerCase())
  );

  const html = rows.length ? `
    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th><th>Cliente</th><th>Auto</th><th>Precio Venta</th>
          <th>Forma de Pago</th><th>Fecha</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(v => `
          <tr>
            <td class="cell-id">#${v.id_venta}</td>
            <td>
              <div class="cell-main">${v.nombres || '—'} ${v.apellidos || ''}</div>
              <div class="cell-sub">ID Cliente #${v.id_cliente}</div>
            </td>
            <td>
              <div class="cell-main">${v.marca || '—'} ${v.modelo || ''}</div>
              <div class="cell-sub">ID Auto #${v.id_auto}</div>
            </td>
            <td class="cell-price">${fmtPrice(v.precio_venta)}</td>
            <td>${badgeFormaPago(v.forma_pago)}</td>
            <td style="color:var(--text-3);font-size:0.82rem">${fmtDate(v.fecha_venta)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="table-footer">
      <span>${rows.length} venta${rows.length !== 1 ? 's' : ''}</span>
      <span>Total: $${fmt(rows.reduce((s,v)=>s+Number(v.precio_venta),0))} COP</span>
    </div>
  ` : emptyState('No se encontraron ventas.');

  $('tableVentas').innerHTML = html;
}

$('searchVentas').addEventListener('input', e => renderTableVentas(e.target.value));

function renderVentasStats() {
  const total    = State.ventas.reduce((s,v) => s+Number(v.precio_venta), 0);
  const contado  = State.ventas.filter(v=>v.forma_pago==='contado').length;
  const finCount = State.ventas.filter(v=>v.forma_pago==='financiado').length;

  $('ventasStats').innerHTML = miniStats([
    { icon:'💰', color:'amber',  value: `$${fmt(total)}`, label: 'Ingresos Totales' },
    { icon:'🏷️', color:'teal',   value: State.ventas.length, label: 'Ventas Totales' },
    { icon:'💵', color:'green',  value: contado,  label: 'Contado' },
    { icon:'🏦', color:'violet', value: finCount, label: 'Financiadas' },
  ]);
}

/* ─── FINANCIAMIENTO TABLE ───────────────── */
function renderTableFin(filter = '') {
  const rows = State.financiamiento.filter(f =>
    !filter ||
    f.entidad_bancaria.toLowerCase().includes(filter.toLowerCase())
  );

  const html = rows.length ? `
    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th><th>Venta</th><th>Entidad Bancaria</th><th>Cuota Inicial</th>
          <th>Plazo</th><th>Tasa Interés</th><th>Cuota Mensual</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(f => `
          <tr>
            <td class="cell-id">#${f.id_financiamiento}</td>
            <td><span class="pill">Venta #${f.id_venta}</span></td>
            <td>
              <div class="cell-main">${f.entidad_bancaria}</div>
            </td>
            <td class="cell-price">${fmtPrice(f.cuota_inicial)}</td>
            <td>
              <span class="badge badge-accent">${f.plazo_meses} meses</span>
            </td>
            <td style="font-weight:600;color:var(--orange)">${f.tasa_interes}%</td>
            <td class="cell-price">${fmtPrice(f.cuota_mensual)}<span style="font-size:0.7rem;color:var(--text-3)">/mes</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="table-footer">
      <span>${rows.length} crédito${rows.length !== 1 ? 's' : ''} activo${rows.length !== 1 ? 's' : ''}</span>
      <span>Cuotas mensuales totales: $${fmt(rows.reduce((s,f)=>s+Number(f.cuota_mensual),0))} COP</span>
    </div>
  ` : emptyState('No hay registros de financiamiento.');

  $('tableFin').innerHTML = html;
}

$('searchFin').addEventListener('input', e => renderTableFin(e.target.value));

function renderFinStats() {
  const rows = State.financiamiento;
  const totalCuotas = rows.reduce((s,f) => s+Number(f.cuota_mensual),0);
  const avgTasa     = rows.length ? (rows.reduce((s,f)=>s+Number(f.tasa_interes),0)/rows.length).toFixed(2) : 0;
  const avgPlazo    = rows.length ? Math.round(rows.reduce((s,f)=>s+f.plazo_meses,0)/rows.length) : 0;

  $('finStats').innerHTML = miniStats([
    { icon:'🏦', color:'teal',   value: rows.length,       label: 'Créditos Activos' },
    { icon:'💸', color:'amber',  value: `$${fmt(totalCuotas)}`, label: 'Cuotas/Mes Totales' },
    { icon:'📊', color:'orange', value: `${avgTasa}%`,     label: 'Tasa Promedio' },
    { icon:'📅', color:'violet', value: `${avgPlazo} m`,   label: 'Plazo Promedio' },
  ]);
}

/* ─── MANTENIMIENTO TABLE ────────────────── */
function renderTableMant(filter = '') {
  const rows = State.mantenimiento.filter(m =>
    !filter ||
    [m.descripcion, m.estado].join(' ').toLowerCase().includes(filter.toLowerCase())
  );

  const html = rows.length ? `
    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th><th>Auto</th><th>Cliente</th><th>Descripción</th>
          <th>Costo</th><th>Estado</th><th>Fecha</th><th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(m => `
          <tr>
            <td class="cell-id">#${m.id_mantenimiento}</td>
            <td><span class="pill">Auto #${m.id_auto}</span></td>
            <td>${m.id_cliente ? `<span class="pill">Cliente #${m.id_cliente}</span>` : '<span style="color:var(--text-3)">—</span>'}</td>
            <td class="wrap" style="max-width:220px;white-space:normal;font-size:0.85rem">
              ${m.descripcion}
            </td>
            <td class="cell-price">${fmtPrice(m.costo)}</td>
            <td>${badgeEstadoMant(m.estado)}</td>
            <td style="color:var(--text-3);font-size:0.82rem">${fmtDate(m.fecha)}</td>
            <td>
              <div class="actions-cell">
                <button class="action-btn" onclick="openEditMant(${m.id_mantenimiento})" data-tooltip="Editar">
                  ${editIcon()}
                </button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="table-footer">
      <span>${rows.length} orden${rows.length !== 1 ? 'es' : ''}</span>
      <span>Costo total: $${fmt(rows.reduce((s,m)=>s+Number(m.costo),0))} COP</span>
    </div>
  ` : emptyState('No hay órdenes de mantenimiento.');

  $('tableMant').innerHTML = html;
}

$('searchMant').addEventListener('input', e => renderTableMant(e.target.value));

function renderMantStats() {
  const rows      = State.mantenimiento;
  const pendiente = rows.filter(m=>m.estado==='pendiente').length;
  const enProceso = rows.filter(m=>m.estado==='en_proceso').length;
  const entregado = rows.filter(m=>m.estado==='entregado').length;
  const costoTotal = rows.reduce((s,m)=>s+Number(m.costo),0);

  $('mantStats').innerHTML = miniStats([
    { icon:'⏳', color:'amber',  value: pendiente, label: 'Pendientes' },
    { icon:'🔧', color:'orange', value: enProceso, label: 'En Proceso' },
    { icon:'✅', color:'green',  value: entregado, label: 'Entregados' },
    { icon:'💰', color:'teal',   value: `$${fmt(costoTotal)}`, label: 'Costo Total' },
  ]);
}

/* ─── MINI STATS HELPER ──────────────────── */
function miniStats(items) {
  return items.map(i => `
    <div class="mini-stat">
      <div class="mini-stat-icon ${i.color}">${i.icon}</div>
      <div class="mini-stat-info">
        <strong>${i.value}</strong>
        <small>${i.label}</small>
      </div>
    </div>
  `).join('');
}

/* ─── BADGES ─────────────────────────────── */
function badgeEstadoAuto(e) {
  return e === 'disponible'
    ? `<span class="badge badge-green">Disponible</span>`
    : `<span class="badge badge-rose">Vendido</span>`;
}
function badgeFormaPago(p) {
  return p === 'contado'
    ? `<span class="badge badge-green">Contado</span>`
    : `<span class="badge badge-violet">Financiado</span>`;
}
function badgeEstadoMant(e) {
  const map = {
    pendiente:  'badge-amber',
    en_proceso: 'badge-orange',
    entregado:  'badge-green',
  };
  const labels = { pendiente: 'Pendiente', en_proceso: 'En Proceso', entregado: 'Entregado' };
  return `<span class="badge ${map[e]||'badge-neutral'}">${labels[e]||e}</span>`;
}

function emptyState(msg) {
  return `<div class="empty-state">
    <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    <p>${msg}</p>
  </div>`;
}

/* ═══════════════════════════════════════════
   MODAL SYSTEM
═══════════════════════════════════════════ */
let _modalSaveHandler = null;

function openModal(title, bodyHTML, onSave) {
  $('modalTitle').textContent = title;
  $('modalBody').innerHTML = bodyHTML;
  $('modalBackdrop').classList.add('open');

  if (_modalSaveHandler) $('modalSave').removeEventListener('click', _modalSaveHandler);
  _modalSaveHandler = onSave;
  $('modalSave').addEventListener('click', _modalSaveHandler);
}

function closeModal() {
  $('modalBackdrop').classList.remove('open');
}

$('modalClose').addEventListener('click', closeModal);
$('modalCancel').addEventListener('click', closeModal);
$('modalBackdrop').addEventListener('click', e => {
  if (e.target === $('modalBackdrop')) closeModal();
});

/* ─── FORM HELPERS ───────────────────────── */
function formField(name, label, type='text', value='', placeholder='', options=null) {
  if (options) {
    return `<div class="form-group">
      <label>${label}</label>
      <select name="${name}">
        ${options.map(o =>
          `<option value="${o.v}" ${o.v==value?'selected':''}>${o.l}</option>`
        ).join('')}
      </select>
    </div>`;
  }
  return `<div class="form-group">
    <label>${label}</label>
    <input type="${type}" name="${name}" value="${value||''}" placeholder="${placeholder}" />
  </div>`;
}

function getFormData(container) {
  const data = {};
  container.querySelectorAll('[name]').forEach(el => {
    data[el.name] = el.value;
  });
  return data;
}

/* ─── AUTOS MODAL ────────────────────────── */
$('btnNewAuto').addEventListener('click', () => {
  openModal('Nuevo Auto', `
    <div class="form-grid">
      ${formField('marca',  'Marca',   'text', '', 'Toyota, Mazda…')}
      ${formField('modelo', 'Modelo',  'text', '', 'Corolla, CX-5…')}
      ${formField('anio',   'Año',     'number', new Date().getFullYear(), '2024')}
      ${formField('color',  'Color',   'text', '', 'Blanco, Rojo…')}
      <div class="form-group full">
        ${formField('precio','Precio (COP)','number','','95000000')}
      </div>
    </div>
  `, async () => {
    const body = getFormData($('modalBody'));
    try {
      await Api.autos.create(body);
      toast('Auto creado exitosamente', 'success');
      closeModal();
      loadAll();
    } catch (e) { toast(e.message, 'error'); }
  });
});

window.openEditAuto = function(id) {
  const a = State.autos.find(a => a.id_auto == id);
  if (!a) return;
  openModal(`Editar Auto #${id}`, `
    <div class="form-grid">
      ${formField('marca',  'Marca',   'text', a.marca)}
      ${formField('modelo', 'Modelo',  'text', a.modelo)}
      ${formField('anio',   'Año',     'number', a.anio)}
      ${formField('color',  'Color',   'text', a.color)}
      ${formField('precio', 'Precio',  'number', a.precio)}
      <div class="form-group full">
        ${formField('estado','Estado','',a.estado,'', [
          {v:'disponible',l:'Disponible'},{v:'vendido',l:'Vendido'}
        ])}
      </div>
    </div>
  `, async () => {
    const body = getFormData($('modalBody'));
    try {
      await Api.autos.update(id, body);
      toast('Auto actualizado', 'success');
      closeModal();
      loadAll();
    } catch (e) { toast(e.message, 'error'); }
  });
};

window.deleteAuto = function(id) {
  const a = State.autos.find(a => a.id_auto == id);
  $('modalSave').className = 'btn btn-danger';
  $('modalSave').textContent = 'Eliminar';
  openModal('Confirmar Eliminación', `
    <div class="confirm-body">
      <p>¿Está seguro que desea eliminar el auto <strong>${a?.marca} ${a?.modelo}</strong>?<br>Esta acción no se puede deshacer.</p>
    </div>
  `, async () => {
    try {
      await Api.autos.delete(id);
      toast('Auto eliminado', 'success');
      closeModal();
      loadAll();
    } catch (e) { toast(e.message, 'error'); }
    finally { $('modalSave').className = 'btn btn-primary'; $('modalSave').textContent = 'Guardar'; }
  });
};

/* ─── CLIENTES MODAL ─────────────────────── */
$('btnNewCliente').addEventListener('click', () => {
  openModal('Nuevo Cliente', `
    <div class="form-grid">
      ${formField('nombres',   'Nombres',   'text', '', 'Carlos')}
      ${formField('apellidos', 'Apellidos', 'text', '', 'Martínez')}
      ${formField('cedula',    'Cédula',    'text', '', '1085001001')}
      ${formField('telefono',  'Teléfono',  'tel',  '', '3001234567')}
      <div class="form-group full">
        ${formField('email', 'Email', 'email', '', 'correo@email.com')}
      </div>
    </div>
  `, async () => {
    const body = getFormData($('modalBody'));
    try {
      await Api.clientes.create(body);
      toast('Cliente registrado exitosamente', 'success');
      closeModal();
      loadAll();
    } catch (e) { toast(e.message, 'error'); }
  });
});

window.openEditCliente = function(id) {
  const c = State.clientes.find(c => c.id_cliente == id);
  if (!c) return;
  openModal(`Editar Cliente #${id}`, `
    <div class="form-grid">
      ${formField('nombres',   'Nombres',   'text',  c.nombres)}
      ${formField('apellidos', 'Apellidos', 'text',  c.apellidos)}
      ${formField('cedula',    'Cédula',    'text',  c.cedula)}
      ${formField('telefono',  'Teléfono',  'tel',   c.telefono)}
      <div class="form-group full">
        ${formField('email', 'Email', 'email', c.email)}
      </div>
    </div>
  `, async () => {
    const body = getFormData($('modalBody'));
    try {
      await Api.clientes.update(id, body);
      toast('Cliente actualizado', 'success');
      closeModal();
      loadAll();
    } catch (e) { toast(e.message, 'error'); }
  });
};

window.deleteCliente = function(id) {
  const c = State.clientes.find(c => c.id_cliente == id);
  $('modalSave').className = 'btn btn-danger';
  $('modalSave').textContent = 'Eliminar';
  openModal('Confirmar Eliminación', `
    <div class="confirm-body">
      <p>¿Eliminar al cliente <strong>${c?.nombres} ${c?.apellidos}</strong>?<br>Esta acción no se puede deshacer.</p>
    </div>
  `, async () => {
    try {
      await Api.clientes.delete(id);
      toast('Cliente eliminado', 'success');
      closeModal();
      loadAll();
    } catch (e) { toast(e.message, 'error'); }
    finally { $('modalSave').className = 'btn btn-primary'; $('modalSave').textContent = 'Guardar'; }
  });
};

/* ─── VENTAS MODAL ───────────────────────── */
$('btnNewVenta').addEventListener('click', () => {
  const autoOpts    = State.autos.filter(a=>a.estado==='disponible')
    .map(a => ({ v: a.id_auto, l: `#${a.id_auto} - ${a.marca} ${a.modelo} ($${fmt(a.precio)})` }));
  const clienteOpts = State.clientes
    .map(c => ({ v: c.id_cliente, l: `#${c.id_cliente} - ${c.nombres} ${c.apellidos}` }));

  openModal('Nueva Venta', `
    <div class="form-grid">
      <div class="form-group full">
        ${formField('id_auto','Auto (disponibles)','','','',autoOpts.length ? autoOpts : [{v:'',l:'Sin autos disponibles'}])}
      </div>
      <div class="form-group full">
        ${formField('id_cliente','Cliente','','','',clienteOpts.length ? clienteOpts : [{v:'',l:'Sin clientes registrados'}])}
      </div>
      ${formField('precio_venta','Precio de Venta (COP)','number','','95000000')}
      <div class="form-group">
        ${formField('forma_pago','Forma de Pago','','contado','', [
          {v:'contado',l:'Contado'},{v:'financiado',l:'Financiado'}
        ])}
      </div>
    </div>
  `, async () => {
    const body = getFormData($('modalBody'));
    try {
      await Api.ventas.create(body);
      toast('Venta registrada exitosamente', 'success');
      closeModal();
      loadAll();
    } catch (e) { toast(e.message, 'error'); }
  });
});

/* ─── FINANCIAMIENTO MODAL ───────────────── */
$('btnNewFin').addEventListener('click', () => {
  const ventaOpts = State.ventas
    .filter(v => v.forma_pago === 'financiado')
    .map(v => ({ v: v.id_venta, l: `#${v.id_venta} - ${v.nombres||''} ${v.apellidos||''}` }));

  openModal('Nuevo Financiamiento', `
    <div class="form-grid">
      <div class="form-group full">
        ${formField('id_venta','Venta Financiada','','','', ventaOpts.length ? ventaOpts : [{v:'',l:'Sin ventas financiadas'}])}
      </div>
      <div class="form-group full">
        ${formField('entidad_bancaria','Entidad Bancaria','text','','Bancolombia, Davivienda…')}
      </div>
      ${formField('cuota_inicial','Cuota Inicial (COP)','number','','20000000')}
      ${formField('plazo_meses','Plazo (meses)','number','','60')}
      ${formField('tasa_interes','Tasa de Interés (%)','number','','14.5')}
      ${formField('cuota_mensual','Cuota Mensual (COP)','number','','1720000')}
    </div>
  `, async () => {
    const body = getFormData($('modalBody'));
    try {
      await Api.financiamiento.create(body);
      toast('Financiamiento registrado', 'success');
      closeModal();
      loadAll();
    } catch (e) { toast(e.message, 'error'); }
  });
});

/* ─── MANTENIMIENTO MODAL ────────────────── */
$('btnNewMant').addEventListener('click', () => {
  const autoOpts    = State.autos.map(a => ({ v: a.id_auto, l: `#${a.id_auto} - ${a.marca} ${a.modelo}` }));
  const clienteOpts = [{v:'',l:'Sin cliente'}]
    .concat(State.clientes.map(c => ({ v: c.id_cliente, l: `${c.nombres} ${c.apellidos}` })));

  openModal('Nueva Orden de Mantenimiento', `
    <div class="form-grid">
      <div class="form-group full">
        ${formField('id_auto','Auto','','','',autoOpts.length ? autoOpts : [{v:'',l:'Sin autos'}])}
      </div>
      <div class="form-group full">
        ${formField('id_cliente','Cliente (opcional)','','','',clienteOpts)}
      </div>
      <div class="form-group full">
        <label>Descripción del Servicio</label>
        <textarea name="descripcion" placeholder="Cambio de aceite, alineación…"></textarea>
      </div>
      ${formField('costo','Costo (COP)','number','0','80000')}
      <div class="form-group">
        ${formField('estado','Estado','','pendiente','', [
          {v:'pendiente',l:'Pendiente'},
          {v:'en_proceso',l:'En Proceso'},
          {v:'entregado',l:'Entregado'},
        ])}
      </div>
    </div>
  `, async () => {
    const body = getFormData($('modalBody'));
    if (!body.id_cliente) body.id_cliente = null;
    try {
      await Api.mantenimiento.create(body);
      toast('Orden de mantenimiento creada', 'success');
      closeModal();
      loadAll();
    } catch (e) { toast(e.message, 'error'); }
  });
});

window.openEditMant = function(id) {
  const m = State.mantenimiento.find(m => m.id_mantenimiento == id);
  if (!m) return;
  openModal(`Editar Mantenimiento #${id}`, `
    <div class="form-grid">
      <div class="form-group full">
        <label>Descripción</label>
        <textarea name="descripcion">${m.descripcion}</textarea>
      </div>
      ${formField('costo','Costo (COP)','number',m.costo)}
      <div class="form-group">
        ${formField('estado','Estado','','','',[
          {v:'pendiente',l:'Pendiente'},
          {v:'en_proceso',l:'En Proceso'},
          {v:'entregado',l:'Entregado'},
        ].map(o => ({...o, selected: o.v === m.estado})))}
      </div>
    </div>
  `, async () => {
    const body = getFormData($('modalBody'));
    try {
      await Api.mantenimiento.update(id, body);
      toast('Mantenimiento actualizado', 'success');
      closeModal();
      loadAll();
    } catch (e) { toast(e.message, 'error'); }
  });
};

/* ═══════════════════════════════════════════
   SVG ICONS (inline helpers)
═══════════════════════════════════════════ */
function carIcon() {
  return `<svg viewBox="0 0 24 24" fill="none"><path d="M5 17H3v-4l2.5-6h11L19 13v4h-2M5 17a2 2 0 104 0M5 17a2 2 0 014 0M15 17a2 2 0 104 0M15 17a2 2 0 014 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M3 13h18" stroke="currentColor" stroke-width="1.8"/></svg>`;
}
function carIconSmall() {
  return `<svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M5 17H3v-4l2.5-6h11L19 13v4h-2M5 17a2 2 0 104 0M15 17a2 2 0 104 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M3 13h18" stroke="currentColor" stroke-width="1.8"/></svg>`;
}
function checkIcon() {
  return `<svg viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function usersIcon() {
  return `<svg viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="3" stroke="currentColor" stroke-width="1.8"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M16 11c1.66 0 3 1.34 3 3M19 20c0-1.1-.4-2.1-1-2.9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
}
function salesIcon() {
  return `<svg viewBox="0 0 24 24" fill="none"><path d="M9 14l-4-4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 10h11a4 4 0 010 8h-1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
}
function moneyIcon() {
  return `<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M2 10h20" stroke="currentColor" stroke-width="1.8"/><path d="M6 15h4M16 15h2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
}
function toolIcon() {
  return `<svg viewBox="0 0 24 24" fill="none"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
}
function editIcon() {
  return `<svg viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function trashIcon() {
  return `<svg viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
}

/* ═══════════════════════════════════════════
   REFRESH BUTTON
═══════════════════════════════════════════ */
$('btnRefresh').addEventListener('click', loadAll);

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
(async function init() {
  await checkApiStatus();
  await loadAll();
  setInterval(checkApiStatus, 15000);
})();
/*app.js es el cerebro del frontend. 
Maneja el estado de los datos, la navegación entre secciones, 
renderiza las tablas dinámicamente y controla los modales para crear y editar registros
al iniciar, verifica si el backend está activo y carga todos los datos */