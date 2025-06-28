import os
import asyncpg
import asyncio
from typing import Optional, Dict, Any, List
import json
from datetime import datetime

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/analytics")

class DatabaseManager:
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
    
    async def init_pool(self):
        """Initialize connection pool"""
        try:
            self.pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10)
            await self.create_tables()
        except Exception as e:
            print(f"Database connection failed: {e}")
            raise
    
    async def create_tables(self):
        """Create necessary tables"""
        async with self.pool.acquire() as conn:
            # Datasets table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS datasets (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
                )
            """)
            
            # Metrics table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS metrics (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    sql_query TEXT NOT NULL,
                    category VARCHAR(100) NOT NULL,
                    version INTEGER DEFAULT 1,
                    status VARCHAR(50) DEFAULT 'draft',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_run TIMESTAMP NULL
                )
            """)
            
            # Metric results table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS metric_results (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    metric_id UUID REFERENCES metrics(id) ON DELETE CASCADE,
                    result_data JSONB,
                    execution_time_ms INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Sample eCommerce tables
            await self.create_sample_tables(conn)
    
    async def create_sample_tables(self, conn):
        """Create sample eCommerce tables with data"""
        # Users table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                is_active BOOLEAN DEFAULT true
            )
        """)
        
        # Products table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                category VARCHAR(100),
                stock_quantity INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT true
            )
        """)
        
        # Orders table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id),
                total_amount DECIMAL(10,2) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Order items table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS order_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
                product_id UUID REFERENCES products(id),
                quantity INTEGER NOT NULL,
                unit_price DECIMAL(10,2) NOT NULL,
                total_price DECIMAL(10,2) NOT NULL
            )
        """)
        
        # Insert sample data if tables are empty
        user_count = await conn.fetchval("SELECT COUNT(*) FROM users")
        if user_count == 0:
            await self.insert_sample_data(conn)
    
    async def insert_sample_data(self, conn):
        """Insert sample eCommerce data"""
        # Sample users
        users_data = [
            ('john.doe@example.com', 'John', 'Doe'),
            ('jane.smith@example.com', 'Jane', 'Smith'),
            ('bob.johnson@example.com', 'Bob', 'Johnson'),
            ('alice.brown@example.com', 'Alice', 'Brown'),
            ('charlie.wilson@example.com', 'Charlie', 'Wilson'),
        ]
        
        user_ids = []
        for email, first_name, last_name in users_data:
            user_id = await conn.fetchval(
                "INSERT INTO users (email, first_name, last_name) VALUES ($1, $2, $3) RETURNING id",
                email, first_name, last_name
            )
            user_ids.append(user_id)
        
        # Sample products
        products_data = [
            ('Laptop Pro', 'High-performance laptop', 1299.99, 'Electronics'),
            ('Wireless Headphones', 'Noise-cancelling headphones', 199.99, 'Electronics'),
            ('Coffee Maker', 'Automatic coffee maker', 89.99, 'Appliances'),
            ('Running Shoes', 'Comfortable running shoes', 129.99, 'Sports'),
            ('Backpack', 'Durable travel backpack', 79.99, 'Travel'),
            ('Smartphone', 'Latest smartphone model', 899.99, 'Electronics'),
            ('Desk Chair', 'Ergonomic office chair', 249.99, 'Furniture'),
            ('Water Bottle', 'Insulated water bottle', 24.99, 'Sports'),
        ]
        
        product_ids = []
        for name, description, price, category in products_data:
            product_id = await conn.fetchval(
                "INSERT INTO products (name, description, price, category, stock_quantity) VALUES ($1, $2, $3, $4, $5) RETURNING id",
                name, description, price, category, random.randint(10, 100)
            )
            product_ids.append(product_id)
        
        # Sample orders
        statuses = ['completed', 'pending', 'shipped', 'cancelled']
        for _ in range(50):
            user_id = random.choice(user_ids)
            status = random.choice(statuses)
            created_at = datetime.now() - timedelta(days=random.randint(1, 90))
            
            # Create order
            order_id = await conn.fetchval(
                "INSERT INTO orders (user_id, total_amount, status, created_at) VALUES ($1, $2, $3, $4) RETURNING id",
                user_id, 0, status, created_at
            )
            
            # Add order items
            num_items = random.randint(1, 4)
            total_amount = 0
            
            for _ in range(num_items):
                product_id = random.choice(product_ids)
                quantity = random.randint(1, 3)
                
                # Get product price
                unit_price = await conn.fetchval("SELECT price FROM products WHERE id = $1", product_id)
                total_price = unit_price * quantity
                total_amount += total_price
                
                await conn.execute(
                    "INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5)",
                    order_id, product_id, quantity, unit_price, total_price
                )
            
            # Update order total
            await conn.execute("UPDATE orders SET total_amount = $1 WHERE id = $2", total_amount, order_id)

# Global database manager instance
db_manager = DatabaseManager()

async def init_db():
    """Initialize database"""
    await db_manager.init_pool()

async def get_db_pool():
    """Get database pool"""
    if not db_manager.pool:
        await db_manager.init_pool()
    return db_manager.pool