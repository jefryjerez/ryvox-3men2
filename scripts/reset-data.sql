-- Borra clientes, órdenes y productos. Al arrancar de nuevo, la app vuelve a cargar el catálogo inicial (src/lib/products.ts).
-- Local:  npm run db:reset:local      Producción:  npm run db:reset:remote  (y luego desplegar)
DELETE FROM order_items;
DELETE FROM stock_movements;
DELETE FROM orders;
DELETE FROM customers;
DELETE FROM products;
