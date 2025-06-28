/*
  # AnalyticsOS Sample eCommerce Database Schema and Data

  1. New Tables
    - `users` - Customer profiles and registration data
    - `products` - Product catalog with categories and pricing  
    - `orders` - Transaction history with various statuses
    - `order_items` - Individual items within each order
    - `metrics` - Business metric definitions with SQL queries
    - `metric_results` - Stored results from metric executions
    - `datasets` - Database connection configurations

  2. Sample Data
    - 10 sample users with realistic registration dates
    - 15 products across different categories (Electronics, Sports, etc.)
    - Generated orders with realistic patterns and status distribution
    - Business metrics for revenue, AOV, CLV, conversion rates

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read their own data
    - Create indexes for optimal query performance

  4. Analytics Views
    - Monthly revenue aggregations
    - Top products by sales
    - Customer lifetime value calculations
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text UNIQUE NOT NULL,
    first_name text,
    last_name text,
    created_at timestamptz DEFAULT now(),
    last_login timestamptz,
    is_active boolean DEFAULT true
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    price decimal(10,2) NOT NULL,
    category text,
    stock_quantity integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    is_active boolean DEFAULT true
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES users(id),
    total_amount decimal(10,2) NOT NULL,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id),
    quantity integer NOT NULL,
    unit_price decimal(10,2) NOT NULL,
    total_price decimal(10,2) NOT NULL
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Metrics table
CREATE TABLE IF NOT EXISTS metrics (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    sql_query text NOT NULL,
    category text NOT NULL,
    version integer DEFAULT 1,
    status text DEFAULT 'draft',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_run timestamptz NULL
);

ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Metrics are viewable by authenticated users"
  ON metrics
  FOR SELECT
  TO authenticated
  USING (true);

-- Metric results table
CREATE TABLE IF NOT EXISTS metric_results (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_id uuid REFERENCES metrics(id) ON DELETE CASCADE,
    result_data jsonb,
    execution_time_ms integer,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE metric_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Metric results are viewable by authenticated users"
  ON metric_results
  FOR SELECT
  TO authenticated
  USING (true);

-- Datasets table
CREATE TABLE IF NOT EXISTS datasets (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    type text NOT NULL,
    host text NOT NULL,
    port integer NOT NULL,
    database_name text NOT NULL,
    username text NOT NULL,
    password_encrypted text NOT NULL,
    status text DEFAULT 'disconnected',
    tables_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Datasets are viewable by authenticated users"
  ON datasets
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert sample users
INSERT INTO users (email, first_name, last_name, created_at) VALUES
('john.doe@example.com', 'John', 'Doe', now() - interval '90 days'),
('jane.smith@example.com', 'Jane', 'Smith', now() - interval '85 days'),
('bob.johnson@example.com', 'Bob', 'Johnson', now() - interval '80 days'),
('alice.brown@example.com', 'Alice', 'Brown', now() - interval '75 days'),
('charlie.wilson@example.com', 'Charlie', 'Wilson', now() - interval '70 days'),
('diana.davis@example.com', 'Diana', 'Davis', now() - interval '65 days'),
('frank.miller@example.com', 'Frank', 'Miller', now() - interval '60 days'),
('grace.taylor@example.com', 'Grace', 'Taylor', now() - interval '55 days'),
('henry.anderson@example.com', 'Henry', 'Anderson', now() - interval '50 days'),
('ivy.thomas@example.com', 'Ivy', 'Thomas', now() - interval '45 days')
ON CONFLICT (email) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, price, category, stock_quantity, created_at) VALUES
('Laptop Pro 15"', 'High-performance laptop with 16GB RAM and 512GB SSD', 1299.99, 'Electronics', 25, now() - interval '100 days'),
('Wireless Headphones', 'Noise-cancelling Bluetooth headphones', 199.99, 'Electronics', 50, now() - interval '95 days'),
('Coffee Maker Deluxe', 'Automatic drip coffee maker with timer', 89.99, 'Appliances', 30, now() - interval '90 days'),
('Running Shoes Pro', 'Comfortable athletic shoes for running', 129.99, 'Sports', 40, now() - interval '85 days'),
('Travel Backpack', 'Durable 40L travel backpack with laptop compartment', 79.99, 'Travel', 35, now() - interval '80 days'),
('Smartphone X1', 'Latest smartphone with 128GB storage', 899.99, 'Electronics', 20, now() - interval '75 days'),
('Ergonomic Desk Chair', 'Adjustable office chair with lumbar support', 249.99, 'Furniture', 15, now() - interval '70 days'),
('Stainless Water Bottle', 'Insulated 32oz water bottle', 24.99, 'Sports', 100, now() - interval '65 days'),
('Bluetooth Speaker', 'Portable wireless speaker with 12-hour battery', 79.99, 'Electronics', 45, now() - interval '60 days'),
('Yoga Mat Premium', 'Non-slip exercise mat with carrying strap', 39.99, 'Sports', 60, now() - interval '55 days'),
('Smart Watch Series 5', 'Fitness tracker with heart rate monitor', 299.99, 'Electronics', 30, now() - interval '50 days'),
('Kitchen Knife Set', 'Professional 8-piece knife set with block', 149.99, 'Kitchen', 25, now() - interval '45 days'),
('Wireless Mouse', 'Ergonomic wireless mouse with USB receiver', 29.99, 'Electronics', 80, now() - interval '40 days'),
('Desk Lamp LED', 'Adjustable LED desk lamp with USB charging port', 59.99, 'Furniture', 40, now() - interval '35 days'),
('Protein Powder Vanilla', '2lb whey protein powder supplement', 49.99, 'Health', 50, now() - interval '30 days')
ON CONFLICT DO NOTHING;

-- Generate sample orders with realistic patterns
DO $$
DECLARE
    user_record RECORD;
    product_record RECORD;
    current_order_id uuid;
    num_orders integer;
    order_date timestamptz;
    order_status text;
    num_items integer;
    order_total_amount decimal(10,2);
    item_total_price decimal(10,2);
    item_quantity integer;
BEGIN
    -- For each user, create 1-8 orders
    FOR user_record IN SELECT id FROM users LOOP
        num_orders := floor(random() * 8) + 1;
        
        FOR i IN 1..num_orders LOOP
            -- Random order date within last 90 days
            order_date := now() - (random() * interval '90 days');
            
            -- Random status with realistic distribution
            CASE floor(random() * 10)
                WHEN 0, 1 THEN order_status := 'pending';
                WHEN 2 THEN order_status := 'cancelled';
                WHEN 3, 4 THEN order_status := 'shipped';
                ELSE order_status := 'completed';
            END CASE;
            
            -- Create order with initial total of 0
            INSERT INTO orders (user_id, total_amount, status, created_at)
            VALUES (user_record.id, 0, order_status, order_date)
            RETURNING id INTO current_order_id;
            
            -- Add 1-4 items to each order
            num_items := floor(random() * 4) + 1;
            order_total_amount := 0;
            
            FOR j IN 1..num_items LOOP
                -- Select random product
                SELECT id, price INTO product_record 
                FROM products 
                ORDER BY random() 
                LIMIT 1;
                
                -- Random quantity 1-3
                item_quantity := floor(random() * 3) + 1;
                item_total_price := product_record.price * item_quantity;
                order_total_amount := order_total_amount + item_total_price;
                
                INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
                VALUES (current_order_id, product_record.id, item_quantity, product_record.price, item_total_price);
            END LOOP;
            
            -- Update order total using the calculated amount
            UPDATE orders SET total_amount = order_total_amount WHERE id = current_order_id;
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
    date_trunc('month', created_at) as month,
    SUM(total_amount) as revenue,
    COUNT(*) as order_count,
    AVG(total_amount) as avg_order_value
FROM orders 
WHERE status = 'completed'
GROUP BY date_trunc('month', created_at)
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

-- Insert sample business metrics definitions
INSERT INTO metrics (name, description, sql_query, category, status) VALUES
('Monthly Recurring Revenue', 'Total revenue generated per month from completed orders', 
 'SELECT date_trunc(''month'', created_at) as month, SUM(total_amount) as mrr FROM orders WHERE status = ''completed'' GROUP BY month ORDER BY month DESC', 
 'revenue', 'active'),

('Average Order Value', 'Average value of completed orders in the last 30 days',
 'SELECT AVG(total_amount) as aov FROM orders WHERE status = ''completed'' AND created_at >= current_date - interval ''30 days''',
 'revenue', 'active'),

('Customer Lifetime Value', 'Average total value per customer based on completed orders',
 'SELECT AVG(customer_total) as clv FROM (SELECT user_id, SUM(total_amount) as customer_total FROM orders WHERE status = ''completed'' GROUP BY user_id) customer_totals',
 'customers', 'active'),

('Conversion Rate', 'Percentage of orders that are completed vs total orders',
 'SELECT (COUNT(CASE WHEN status = ''completed'' THEN 1 END) * 100.0 / COUNT(*)) as conversion_rate FROM orders WHERE created_at >= current_date - interval ''30 days''',
 'orders', 'active'),

('Top Products by Revenue', 'Products generating the most revenue in the last 30 days',
 'SELECT p.name, SUM(oi.total_price) as revenue FROM products p JOIN order_items oi ON p.id = oi.product_id JOIN orders o ON oi.order_id = o.id WHERE o.status = ''completed'' AND o.created_at >= current_date - interval ''30 days'' GROUP BY p.id, p.name ORDER BY revenue DESC LIMIT 10',
 'products', 'active')
ON CONFLICT DO NOTHING;

-- Insert a sample dataset connection
INSERT INTO datasets (name, type, host, port, database_name, username, password_encrypted, status, tables_count)
VALUES ('Local Analytics DB', 'postgresql', 'localhost', 5432, 'analytics', 'postgres', 'postgres', 'connected', 4)
ON CONFLICT DO NOTHING;