-- AnalyticsOS Sample eCommerce Database Schema and Data
-- This file creates sample tables and inserts dummy data for testing

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);

-- Insert sample users
INSERT INTO users (email, first_name, last_name, created_at) VALUES
('john.doe@example.com', 'John', 'Doe', CURRENT_TIMESTAMP - INTERVAL '90 days'),
('jane.smith@example.com', 'Jane', 'Smith', CURRENT_TIMESTAMP - INTERVAL '85 days'),
('bob.johnson@example.com', 'Bob', 'Johnson', CURRENT_TIMESTAMP - INTERVAL '80 days'),
('alice.brown@example.com', 'Alice', 'Brown', CURRENT_TIMESTAMP - INTERVAL '75 days'),
('charlie.wilson@example.com', 'Charlie', 'Wilson', CURRENT_TIMESTAMP - INTERVAL '70 days'),
('diana.davis@example.com', 'Diana', 'Davis', CURRENT_TIMESTAMP - INTERVAL '65 days'),
('frank.miller@example.com', 'Frank', 'Miller', CURRENT_TIMESTAMP - INTERVAL '60 days'),
('grace.taylor@example.com', 'Grace', 'Taylor', CURRENT_TIMESTAMP - INTERVAL '55 days'),
('henry.anderson@example.com', 'Henry', 'Anderson', CURRENT_TIMESTAMP - INTERVAL '50 days'),
('ivy.thomas@example.com', 'Ivy', 'Thomas', CURRENT_TIMESTAMP - INTERVAL '45 days')
ON CONFLICT (email) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, price, category, stock_quantity, created_at) VALUES
('Laptop Pro 15"', 'High-performance laptop with 16GB RAM and 512GB SSD', 1299.99, 'Electronics', 25, CURRENT_TIMESTAMP - INTERVAL '100 days'),
('Wireless Headphones', 'Noise-cancelling Bluetooth headphones', 199.99, 'Electronics', 50, CURRENT_TIMESTAMP - INTERVAL '95 days'),
('Coffee Maker Deluxe', 'Automatic drip coffee maker with timer', 89.99, 'Appliances', 30, CURRENT_TIMESTAMP - INTERVAL '90 days'),
('Running Shoes Pro', 'Comfortable athletic shoes for running', 129.99, 'Sports', 40, CURRENT_TIMESTAMP - INTERVAL '85 days'),
('Travel Backpack', 'Durable 40L travel backpack with laptop compartment', 79.99, 'Travel', 35, CURRENT_TIMESTAMP - INTERVAL '80 days'),
('Smartphone X1', 'Latest smartphone with 128GB storage', 899.99, 'Electronics', 20, CURRENT_TIMESTAMP - INTERVAL '75 days'),
('Ergonomic Desk Chair', 'Adjustable office chair with lumbar support', 249.99, 'Furniture', 15, CURRENT_TIMESTAMP - INTERVAL '70 days'),
('Stainless Water Bottle', 'Insulated 32oz water bottle', 24.99, 'Sports', 100, CURRENT_TIMESTAMP - INTERVAL '65 days'),
('Bluetooth Speaker', 'Portable wireless speaker with 12-hour battery', 79.99, 'Electronics', 45, CURRENT_TIMESTAMP - INTERVAL '60 days'),
('Yoga Mat Premium', 'Non-slip exercise mat with carrying strap', 39.99, 'Sports', 60, CURRENT_TIMESTAMP - INTERVAL '55 days'),
('Smart Watch Series 5', 'Fitness tracker with heart rate monitor', 299.99, 'Electronics', 30, CURRENT_TIMESTAMP - INTERVAL '50 days'),
('Kitchen Knife Set', 'Professional 8-piece knife set with block', 149.99, 'Kitchen', 25, CURRENT_TIMESTAMP - INTERVAL '45 days'),
('Wireless Mouse', 'Ergonomic wireless mouse with USB receiver', 29.99, 'Electronics', 80, CURRENT_TIMESTAMP - INTERVAL '40 days'),
('Desk Lamp LED', 'Adjustable LED desk lamp with USB charging port', 59.99, 'Furniture', 40, CURRENT_TIMESTAMP - INTERVAL '35 days'),
('Protein Powder Vanilla', '2lb whey protein powder supplement', 49.99, 'Health', 50, CURRENT_TIMESTAMP - INTERVAL '30 days')
ON CONFLICT DO NOTHING;

-- Generate sample orders with realistic patterns
DO $$
DECLARE
    user_record RECORD;
    product_record RECORD;
    order_id UUID;
    num_orders INTEGER;
    order_date TIMESTAMP;
    order_status VARCHAR(50);
    num_items INTEGER;
    total_amount DECIMAL(10,2);
    item_total DECIMAL(10,2);
BEGIN
    -- For each user, create 1-8 orders
    FOR user_record IN SELECT id FROM users LOOP
        num_orders := floor(random() * 8) + 1;
        
        FOR i IN 1..num_orders LOOP
            -- Random order date within last 90 days
            order_date := CURRENT_TIMESTAMP - (random() * INTERVAL '90 days');
            
            -- Random status with realistic distribution
            CASE floor(random() * 10)
                WHEN 0, 1 THEN order_status := 'pending';
                WHEN 2 THEN order_status := 'cancelled';
                WHEN 3, 4 THEN order_status := 'shipped';
                ELSE order_status := 'completed';
            END CASE;
            
            -- Create order
            INSERT INTO orders (user_id, total_amount, status, created_at)
            VALUES (user_record.id, 0, order_status, order_date)
            RETURNING id INTO order_id;
            
            -- Add 1-4 items to each order
            num_items := floor(random() * 4) + 1;
            total_amount := 0;
            
            FOR j IN 1..num_items LOOP
                -- Select random product
                SELECT id, price INTO product_record 
                FROM products 
                ORDER BY random() 
                LIMIT 1;
                
                -- Random quantity 1-3
                DECLARE
                    quantity INTEGER := floor(random() * 3) + 1;
                BEGIN
                    item_total := product_record.price * quantity;
                    total_amount := total_amount + item_total;
                    
                    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
                    VALUES (order_id, product_record.id, quantity, product_record.price, item_total);
                END;
            END LOOP;
            
            -- Update order total
            UPDATE orders SET total_amount = total_amount WHERE id = order_id;
        END LOOP;
    END LOOP;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Create some useful views for analytics
CREATE OR REPLACE VIEW monthly_revenue AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    SUM(total_amount) as revenue,
    COUNT(*) as order_count,
    AVG(total_amount) as avg_order_value
FROM orders 
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;

CREATE OR REPLACE VIEW top_products AS
SELECT 
    p.name,
    p.category,
    SUM(oi.quantity) as total_sold,
    SUM(oi.total_price) as total_revenue
FROM products p
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'completed'
GROUP BY p.id, p.name, p.category
ORDER BY total_revenue DESC;

CREATE OR REPLACE VIEW customer_metrics AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    COUNT(o.id) as total_orders,
    SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END) as lifetime_value,
    AVG(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE NULL END) as avg_order_value,
    MAX(o.created_at) as last_order_date
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.email, u.first_name, u.last_name;

-- Insert some sample business metrics definitions
CREATE TABLE IF NOT EXISTS metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sql_query TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    version INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_run TIMESTAMP NULL
);

INSERT INTO metrics (name, description, sql_query, category, status) VALUES
('Monthly Recurring Revenue', 'Total revenue generated per month from completed orders', 
 'SELECT DATE_TRUNC(''month'', created_at) as month, SUM(total_amount) as mrr FROM orders WHERE status = ''completed'' GROUP BY month ORDER BY month DESC', 
 'revenue', 'active'),

('Average Order Value', 'Average value of completed orders in the last 30 days',
 'SELECT AVG(total_amount) as aov FROM orders WHERE status = ''completed'' AND created_at >= CURRENT_DATE - INTERVAL ''30 days''',
 'revenue', 'active'),

('Customer Lifetime Value', 'Average total value per customer based on completed orders',
 'SELECT AVG(customer_total) as clv FROM (SELECT user_id, SUM(total_amount) as customer_total FROM orders WHERE status = ''completed'' GROUP BY user_id) customer_totals',
 'customers', 'active'),

('Conversion Rate', 'Percentage of orders that are completed vs total orders',
 'SELECT (COUNT(CASE WHEN status = ''completed'' THEN 1 END) * 100.0 / COUNT(*)) as conversion_rate FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL ''30 days''',
 'orders', 'active'),

('Top Products by Revenue', 'Products generating the most revenue in the last 30 days',
 'SELECT p.name, SUM(oi.total_price) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id JOIN orders o ON oi.order_id = o.id WHERE o.status = ''completed'' AND o.created_at >= CURRENT_DATE - INTERVAL ''30 days'' GROUP BY p.id, p.name ORDER BY revenue DESC LIMIT 10',
 'products', 'active')
ON CONFLICT DO NOTHING;

-- Create metric results table for storing execution results
CREATE TABLE IF NOT EXISTS metric_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_id UUID REFERENCES metrics(id) ON DELETE CASCADE,
    result_data JSONB,
    execution_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create datasets table for database connections
CREATE TABLE IF NOT EXISTS datasets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL,
    database_name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    password_encrypted TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'disconnected',
    tables_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert a sample dataset connection (local database)
INSERT INTO datasets (name, type, host, port, database_name, username, password_encrypted, status, tables_count)
VALUES ('Local Analytics DB', 'postgresql', 'localhost', 5432, 'analytics', 'postgres', 'postgres', 'connected', 4)
ON CONFLICT DO NOTHING;

-- Final data summary
DO $$
DECLARE
    user_count INTEGER;
    product_count INTEGER;
    order_count INTEGER;
    total_revenue DECIMAL(10,2);
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO product_count FROM products;
    SELECT COUNT(*) INTO order_count FROM orders;
    SELECT SUM(total_amount) INTO total_revenue FROM orders WHERE status = 'completed';
    
    RAISE NOTICE 'AnalyticsOS Sample Data Created Successfully!';
    RAISE NOTICE 'Users: %, Products: %, Orders: %', user_count, product_count, order_count;
    RAISE NOTICE 'Total Revenue: $%', total_revenue;
END $$;