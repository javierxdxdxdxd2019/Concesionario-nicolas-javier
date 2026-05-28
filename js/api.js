/* ═══════════════════════════════════════════
   AUTOADMIN — API.JS
   All communication with localhost:3000
═══════════════════════════════════════════ */

const API_BASE = 'http://localhost:3000';

const Api = {

  // ─── GENERIC REQUEST ─────────────────────
  async request(method, path, body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  },

  get:    (path)        => Api.request('GET',    path),
  post:   (path, body)  => Api.request('POST',   path, body),
  put:    (path, body)  => Api.request('PUT',    path, body),
  delete: (path)        => Api.request('DELETE', path),

  // ─── HEALTH CHECK ─────────────────────────
  async ping() {
    try {
      await fetch(`${API_BASE}/autos`, { signal: AbortSignal.timeout(3000) });
      return true;
    } catch { return false; }
  },

  // ─── AUTOS ───────────────────────────────
  autos: {
    getAll:  ()       => Api.get('/autos'),
    getOne:  (id)     => Api.get(`/autos/${id}`),
    create:  (body)   => Api.post('/autos', body),
    update:  (id, b)  => Api.put(`/autos/${id}`, b),
    delete:  (id)     => Api.delete(`/autos/${id}`),
  },

  // ─── CLIENTES ────────────────────────────
  clientes: {
    getAll:  ()       => Api.get('/clientes'),
    getOne:  (id)     => Api.get(`/clientes/${id}`),
    create:  (body)   => Api.post('/clientes', body),
    update:  (id, b)  => Api.put(`/clientes/${id}`, b),
    delete:  (id)     => Api.delete(`/clientes/${id}`),
  },

  // ─── VENTAS ──────────────────────────────
  ventas: {
    getAll:  ()       => Api.get('/ventas'),
    getOne:  (id)     => Api.get(`/ventas/${id}`),
    create:  (body)   => Api.post('/ventas', body),
  },

  // ─── FINANCIAMIENTO ──────────────────────
  financiamiento: {
    getAll:  ()       => Api.get('/financiamiento'),
    create:  (body)   => Api.post('/financiamiento', body),
  },

  // ─── MANTENIMIENTO ───────────────────────
  mantenimiento: {
    getAll:  ()       => Api.get('/mantenimiento'),
    getOne:  (id)     => Api.get(`/mantenimiento/${id}`),
    create:  (body)   => Api.post('/mantenimiento', body),
    update:  (id, b)  => Api.put(`/mantenimiento/${id}`, b),
  },
};
