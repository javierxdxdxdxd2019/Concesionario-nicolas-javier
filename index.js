const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
// ─── CONEXIÓN ────────────────────────────────────────────────
const db = mysql.createPool({
  host: 'zephyr.proxy.rlwy.net',
  user: 'root',
  password: 'zXgTFhHUQmhCqjUvmcVtNZCbQzckyFLA',
  database: 'railway',
  port: 40703
});

db.getConnection((err, connection) => {
  if (err) { console.error('Error conectando:', err); return; }
  console.log('Conectado a MySQL');
  connection.release();
});

// ─── AUTOS ───────────────────────────────────────────────────
app.get('/autos', (req, res) => {
  db.query('SELECT * FROM autos', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/autos/:id', (req, res) => {
  db.query('SELECT * FROM autos WHERE id_auto = ?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows.length) return res.status(404).json({ error: 'Auto no encontrado' });
    res.json(rows[0]);
  });
});

app.post('/autos', (req, res) => {
  const { marca, modelo, anio, color, precio } = req.body;
  db.query(
    'INSERT INTO autos (marca, modelo, anio, color, precio) VALUES (?, ?, ?, ?, ?)',
    [marca, modelo, anio, color, precio],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id_auto: result.insertId, mensaje: 'Auto creado' });
    }
  );
});

app.put('/autos/:id', (req, res) => {
  const { marca, modelo, anio, color, precio, estado } = req.body;
  db.query(
    'UPDATE autos SET marca=?, modelo=?, anio=?, color=?, precio=?, estado=? WHERE id_auto=?',
    [marca, modelo, anio, color, precio, estado, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: 'Auto actualizado' });
    }
  );
});

app.delete('/autos/:id', (req, res) => {
  db.query('DELETE FROM autos WHERE id_auto = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Auto eliminado' });
  });
});

// ─── CLIENTES ────────────────────────────────────────────────
app.get('/clientes', (req, res) => {
  db.query('SELECT * FROM clientes', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/clientes/:id', (req, res) => {
  db.query('SELECT * FROM clientes WHERE id_cliente = ?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows.length) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(rows[0]);
  });
});

app.post('/clientes', (req, res) => {
  const { nombres, apellidos, cedula, telefono, email } = req.body;
  db.query(
    'INSERT INTO clientes (nombres, apellidos, cedula, telefono, email) VALUES (?, ?, ?, ?, ?)',
    [nombres, apellidos, cedula, telefono, email],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id_cliente: result.insertId, mensaje: 'Cliente creado' });
    }
  );
});

app.put('/clientes/:id', (req, res) => {
  const { nombres, apellidos, cedula, telefono, email } = req.body;
  db.query(
    'UPDATE clientes SET nombres=?, apellidos=?, cedula=?, telefono=?, email=? WHERE id_cliente=?',
    [nombres, apellidos, cedula, telefono, email, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: 'Cliente actualizado' });
    }
  );
});

app.delete('/clientes/:id', (req, res) => {
  db.query('DELETE FROM clientes WHERE id_cliente = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ mensaje: 'Cliente eliminado' });
  });
});

// ─── VENTAS ──────────────────────────────────────────────────
app.get('/ventas', (req, res) => {
  const sql = `
    SELECT v.*, c.nombres, c.apellidos, a.marca, a.modelo
    FROM ventas v
    JOIN clientes c ON v.id_cliente = c.id_cliente
    JOIN autos    a ON v.id_auto    = a.id_auto
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/ventas/:id', (req, res) => {
  db.query('SELECT * FROM ventas WHERE id_venta = ?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows.length) return res.status(404).json({ error: 'Venta no encontrada' });
    res.json(rows[0]);
  });
});

app.post('/ventas', (req, res) => {
  const { id_auto, id_cliente, precio_venta, forma_pago } = req.body;
  db.query(
    'INSERT INTO ventas (id_auto, id_cliente, precio_venta, forma_pago) VALUES (?, ?, ?, ?)',
    [id_auto, id_cliente, precio_venta, forma_pago],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      // marcar auto como vendido
      db.query('UPDATE autos SET estado = "vendido" WHERE id_auto = ?', [id_auto]);
      res.status(201).json({ id_venta: result.insertId, mensaje: 'Venta registrada' });
    }
  );
});

// ─── FINANCIAMIENTO ──────────────────────────────────────────
app.get('/financiamiento', (req, res) => {
  db.query('SELECT * FROM financiamiento', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/financiamiento', (req, res) => {
  const { id_venta, entidad_bancaria, cuota_inicial, plazo_meses, tasa_interes, cuota_mensual } = req.body;
  db.query(
    'INSERT INTO financiamiento (id_venta, entidad_bancaria, cuota_inicial, plazo_meses, tasa_interes, cuota_mensual) VALUES (?, ?, ?, ?, ?, ?)',
    [id_venta, entidad_bancaria, cuota_inicial, plazo_meses, tasa_interes, cuota_mensual],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id_financiamiento: result.insertId, mensaje: 'Financiamiento registrado' });
    }
  );
});

// ─── MANTENIMIENTO ───────────────────────────────────────────
app.get('/mantenimiento', (req, res) => {
  db.query('SELECT * FROM mantenimiento', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/mantenimiento/:id', (req, res) => {
  db.query('SELECT * FROM mantenimiento WHERE id_mantenimiento = ?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows.length) return res.status(404).json({ error: 'Mantenimiento no encontrado' });
    res.json(rows[0]);
  });
});

app.post('/mantenimiento', (req, res) => {
  const { id_auto, id_cliente, descripcion, costo, estado } = req.body;
  db.query(
    'INSERT INTO mantenimiento (id_auto, id_cliente, descripcion, costo, estado) VALUES (?, ?, ?, ?, ?)',
    [id_auto, id_cliente || null, descripcion, costo, estado || 'pendiente'],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id_mantenimiento: result.insertId, mensaje: 'Mantenimiento creado' });
    }
  );
});

app.put('/mantenimiento/:id', (req, res) => {
  const { descripcion, costo, estado } = req.body;
  db.query(
    'UPDATE mantenimiento SET descripcion=?, costo=?, estado=? WHERE id_mantenimiento=?',
    [descripcion, costo, estado, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: 'Mantenimiento actualizado' });
    }
  );
});

// ─── ARRANCAR ────────────────────────────────────────────────
app.listen(3000, () => console.log('Backend corriendo en http://localhost:3000'));
