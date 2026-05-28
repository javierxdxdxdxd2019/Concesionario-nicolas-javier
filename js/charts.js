/* ═══════════════════════════════════════════
   AUTOADMIN — CHARTS.JS
   All Chart.js chart instances and logic
═══════════════════════════════════════════ */

const Charts = (() => {

  /* ─── PALETTE ──────────────────────────── */
  const C = {
    teal:   '#3ecfcf',
    green:  '#22c55e',
    orange: '#f97316',
    rose:   '#f43f5e',
    violet: '#8b5cf6',
    amber:  '#f59e0b',
    navy:   '#0d1b2a',
    border: '#e1e8f0',
    text:   '#8fa3b8',
  };

  /* Shared defaults injected into Chart.js */
  Chart.defaults.font.family = "'DM Sans', sans-serif";
  Chart.defaults.font.size   = 12;
  Chart.defaults.color       = C.text;
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.pointStyleWidth = 8;
  Chart.defaults.plugins.legend.labels.padding = 16;

  const instances = {};

  function destroy(id) {
    if (instances[id]) {
      instances[id].destroy();
      delete instances[id];
    }
  }

  /* ─── VENTAS POR PRECIO (bar) ─────────── */
  function ventasPrecio(ventas) {
    destroy('chartVentasPrecio');
    const ctx = document.getElementById('chartVentasPrecio');
    if (!ctx) return;

    const labels = ventas.map((v, i) =>
      `#${v.id_venta} ${v.nombres || ''}`
    );
    const data   = ventas.map(v => Number(v.precio_venta));

    instances['chartVentasPrecio'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Precio de Venta (COP)',
          data,
          backgroundColor: data.map((_, i) =>
            i % 2 === 0 ? C.teal : C.violet
          ),
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => `$ ${Number(ctx.raw).toLocaleString('es-CO')}`
            }
          }
        },
        scales: {
          x: { grid: { display: false }, border: { display: false } },
          y: {
            grid: { color: C.border, lineWidth: 1 },
            border: { display: false, dash: [4,4] },
            ticks: {
              callback: v => `$${(v/1e6).toFixed(0)}M`
            }
          }
        }
      }
    });
  }

  /* ─── FORMA DE PAGO (doughnut) ───────── */
  function formaPago(ventas) {
    destroy('chartFormaPago');
    const ctx = document.getElementById('chartFormaPago');
    if (!ctx) return;

    const contado     = ventas.filter(v => v.forma_pago === 'contado').length;
    const financiado  = ventas.filter(v => v.forma_pago === 'financiado').length;

    instances['chartFormaPago'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Contado', 'Financiado'],
        datasets: [{
          data: [contado, financiado],
          backgroundColor: [C.green, C.teal],
          borderWidth: 0,
          hoverOffset: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.raw} venta(s)`
            }
          }
        }
      }
    });
  }

  /* ─── AUTOS POR MARCA (horizontal bar) ─ */
  function marcas(autos) {
    destroy('chartMarcas');
    const ctx = document.getElementById('chartMarcas');
    if (!ctx) return;

    const counts = {};
    autos.forEach(a => {
      counts[a.marca] = (counts[a.marca] || 0) + 1;
    });
    const labels = Object.keys(counts);
    const data   = Object.values(counts);
    const colors = [C.teal, C.violet, C.orange, C.rose, C.amber, C.green];

    instances['chartMarcas'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Unidades',
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { color: C.border },
            border: { display: false },
            ticks: { stepSize: 1 }
          },
          y: { grid: { display: false }, border: { display: false } }
        }
      }
    });
  }

  /* ─── ESTADO INVENTARIO (pie) ─────────── */
  function estadoInventario(autos) {
    destroy('chartEstado');
    const ctx = document.getElementById('chartEstado');
    if (!ctx) return;

    const disponible = autos.filter(a => a.estado === 'disponible').length;
    const vendido    = autos.filter(a => a.estado === 'vendido').length;

    instances['chartEstado'] = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Disponible', 'Vendido'],
        datasets: [{
          data: [disponible, vendido],
          backgroundColor: [C.green, C.rose],
          borderWidth: 0,
          hoverOffset: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.raw} auto(s)`
            }
          }
        }
      }
    });
  }

  /* ─── MANTENIMIENTO POR ESTADO (doughnut) */
  function mantenimientoEstado(mants) {
    destroy('chartMant');
    const ctx = document.getElementById('chartMant');
    if (!ctx) return;

    const pend    = mants.filter(m => m.estado === 'pendiente').length;
    const proceso = mants.filter(m => m.estado === 'en_proceso').length;
    const entregado = mants.filter(m => m.estado === 'entregado').length;

    instances['chartMant'] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pendiente', 'En Proceso', 'Entregado'],
        datasets: [{
          data: [pend, proceso, entregado],
          backgroundColor: [C.amber, C.orange, C.green],
          borderWidth: 0,
          hoverOffset: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom' },
        }
      }
    });
  }

  return { ventasPrecio, formaPago, marcas, estadoInventario, mantenimientoEstado };
})();
