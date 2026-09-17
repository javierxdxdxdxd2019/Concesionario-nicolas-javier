CREATE TABLE autos (
    id_auto INT AUTO_INCREMENT PRIMARY KEY,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    anio YEAR NOT NULL,
    color VARCHAR(30),
    precio DECIMAL(12,2) NOT NULL,
    estado ENUM('disponible','vendido') NOT NULL DEFAULT 'disponible'
);

CREATE TABLE clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(80) NOT NULL,
    apellidos VARCHAR(80) NOT NULL,
    cedula VARCHAR(20) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    email VARCHAR(100)
);

CREATE TABLE ventas (
    id_venta INT AUTO_INCREMENT PRIMARY KEY,
    id_auto INT NOT NULL,
    id_cliente INT NOT NULL,
    fecha_venta DATE NOT NULL,
    precio_venta DECIMAL(12,2) NOT NULL,
    forma_pago ENUM('contado','financiado') NOT NULL,
    FOREIGN KEY (id_auto) REFERENCES autos(id_auto),
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
);

CREATE TABLE financiamiento (
    id_financiamiento INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT NOT NULL UNIQUE,
    entidad_bancaria VARCHAR(80) NOT NULL,
    cuota_inicial DECIMAL(12,2) NOT NULL,
    plazo_meses INT NOT NULL,
    tasa_interes DECIMAL(5,2) NOT NULL,
    cuota_mensual DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta)
);

CREATE TABLE mantenimiento (
    id_mantenimiento INT AUTO_INCREMENT PRIMARY KEY,
    id_auto INT NOT NULL,
    id_cliente INT,
    fecha DATE NOT NULL,
    descripcion TEXT NOT NULL,
    costo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estado ENUM('pendiente','en_proceso','entregado') NOT NULL DEFAULT 'pendiente',
    FOREIGN KEY (id_auto) REFERENCES autos(id_auto),
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
);

INSERT INTO autos (marca, modelo, anio, color, precio) VALUES
  ('Toyota', 'Corolla', 2023, 'Blanco', 95000000),
  ('Chevrolet', 'Onix', 2023, 'Rojo', 55000000),
  ('Mazda', 'CX-5', 2024, 'Gris', 118000000);

INSERT INTO clientes (nombres, apellidos, cedula, telefono, email) VALUES
  ('Carlos', 'Martínez', '1085001001', '3001234567', 'carlos@email.com'),
  ('Ana', 'Gómez', '1085001002', '3109876543', 'ana@email.com');

INSERT INTO ventas (id_auto, id_cliente, fecha_venta, precio_venta, forma_pago) VALUES
  (1, 1, '2024-01-15', 95000000, 'financiado'),
  (2, 2, '2024-01-20', 55000000, 'contado');

UPDATE autos SET estado = 'vendido' WHERE id_auto IN (1, 2);

INSERT INTO financiamiento (id_venta, entidad_bancaria, cuota_inicial, plazo_meses, tasa_interes, cuota_mensual) VALUES
  (1, 'Bancolombia', 20000000, 60, 14.50, 1720000);

INSERT INTO mantenimiento (id_auto, id_cliente, fecha, descripcion, costo, estado) VALUES
  (3, NULL, '2024-01-25', 'Cambio de aceite y filtros', 80000, 'en_proceso');
