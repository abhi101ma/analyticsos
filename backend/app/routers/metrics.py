from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncpg
from datetime import datetime, timedelta
import uuid
import json
import random

from ..database import get_db_pool

router = APIRouter()

class MetricCreate(BaseModel):
    name: str
    description: str
    sql_query: str
    category: str

class MetricResponse(BaseModel):
    id: str
    name: str
    description: str
    sql_query: str
    category: str
    version: int
    status: str
    created_at: datetime
    last_run: Optional[datetime]

@router.get("/", response_model=List[MetricResponse])
async def get_metrics():
    """Get all metrics"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id, name, description, sql_query, category, version, status, created_at, last_run
            FROM metrics 
            ORDER BY created_at DESC
        """)
        
        return [dict(row) for row in rows]

@router.post("/", response_model=MetricResponse)
async def create_metric(metric: MetricCreate):
    """Create a new metric"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        metric_id = await conn.fetchval("""
            INSERT INTO metrics (name, description, sql_query, category, status)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        """, metric.name, metric.description, metric.sql_query, metric.category, 'active')
        
        # Get the created metric
        row = await conn.fetchrow("""
            SELECT id, name, description, sql_query, category, version, status, created_at, last_run
            FROM metrics WHERE id = $1
        """, metric_id)
        
        return dict(row)

@router.put("/{metric_id}", response_model=MetricResponse)
async def update_metric(metric_id: str, metric: MetricCreate):
    """Update a metric"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        # Increment version and update
        await conn.execute("""
            UPDATE metrics 
            SET name = $1, description = $2, sql_query = $3, category = $4, 
                version = version + 1, updated_at = $5
            WHERE id = $6
        """, metric.name, metric.description, metric.sql_query, metric.category, 
            datetime.utcnow(), uuid.UUID(metric_id))
        
        # Get the updated metric
        row = await conn.fetchrow("""
            SELECT id, name, description, sql_query, category, version, status, created_at, last_run
            FROM metrics WHERE id = $1
        """, uuid.UUID(metric_id))
        
        if not row:
            raise HTTPException(status_code=404, detail="Metric not found")
        
        return dict(row)

@router.delete("/{metric_id}")
async def delete_metric(metric_id: str):
    """Delete a metric"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        result = await conn.execute("DELETE FROM metrics WHERE id = $1", uuid.UUID(metric_id))
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Metric not found")
        return {"message": "Metric deleted successfully"}

@router.post("/{metric_id}/run")
async def run_metric(metric_id: str):
    """Run a metric and store results"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        # Get metric
        metric = await conn.fetchrow("SELECT * FROM metrics WHERE id = $1", uuid.UUID(metric_id))
        if not metric:
            raise HTTPException(status_code=404, detail="Metric not found")
        
        # Simulate running the SQL query and getting results
        # In production, you would execute the actual SQL query against the target database
        sample_result = {
            "value": random.randint(100, 10000),
            "timestamp": datetime.utcnow().isoformat(),
            "query_executed": metric['sql_query']
        }
        
        # Store result
        await conn.execute("""
            INSERT INTO metric_results (metric_id, result_data, execution_time_ms)
            VALUES ($1, $2, $3)
        """, uuid.UUID(metric_id), json.dumps(sample_result), random.randint(50, 500))
        
        # Update last_run timestamp
        await conn.execute(
            "UPDATE metrics SET last_run = $1 WHERE id = $2",
            datetime.utcnow(), uuid.UUID(metric_id)
        )
        
        return {"message": "Metric executed successfully", "result": sample_result}

@router.get("/dashboard")
async def get_dashboard_metrics():
    """Get dashboard KPI metrics"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        # Get actual metrics from the sample data
        total_revenue = await conn.fetchval("""
            SELECT COALESCE(SUM(total_amount), 0) 
            FROM orders 
            WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        """) or 0
        
        total_orders = await conn.fetchval("""
            SELECT COUNT(*) 
            FROM orders 
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        """) or 0
        
        active_users = await conn.fetchval("""
            SELECT COUNT(DISTINCT user_id) 
            FROM orders 
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        """) or 0
        
        avg_order_value = await conn.fetchval("""
            SELECT COALESCE(AVG(total_amount), 0) 
            FROM orders 
            WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        """) or 0
        
        return {
            "total_revenue": f"${total_revenue:,.2f}",
            "total_orders": f"{total_orders:,}",
            "active_users": f"{active_users:,}",
            "avg_order_value": f"${avg_order_value:.2f}"
        }

@router.get("/charts")
async def get_chart_data():
    """Get chart data for dashboard"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        # Revenue trend (last 30 days)
        revenue_trend = []
        for i in range(30, 0, -1):
            date = datetime.now() - timedelta(days=i)
            revenue = await conn.fetchval("""
                SELECT COALESCE(SUM(total_amount), 0)
                FROM orders 
                WHERE DATE(created_at) = $1 AND status = 'completed'
            """, date.date()) or 0
            
            revenue_trend.append({
                "date": date.strftime("%m/%d"),
                "revenue": float(revenue)
            })
        
        # Orders by status
        orders_by_status = await conn.fetch("""
            SELECT status, COUNT(*) as count
            FROM orders 
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY status
        """)
        
        orders_status_data = [
            {"name": row['status'].title(), "value": row['count']}
            for row in orders_by_status
        ]
        
        # Top products
        top_products = await conn.fetch("""
            SELECT p.name, SUM(oi.quantity) as sales
            FROM products p
            JOIN order_items oi ON p.id = oi.product_id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY p.id, p.name
            ORDER BY sales DESC
            LIMIT 5
        """)
        
        top_products_data = [
            {"name": row['name'][:15] + "..." if len(row['name']) > 15 else row['name'], 
             "sales": row['sales']}
            for row in top_products
        ]
        
        # User growth (simplified)
        user_growth = []
        for i in range(30, 0, -1):
            date = datetime.now() - timedelta(days=i)
            users = await conn.fetchval("""
                SELECT COUNT(DISTINCT user_id)
                FROM orders 
                WHERE created_at <= $1
            """, date) or 0
            
            user_growth.append({
                "date": date.strftime("%m/%d"),
                "users": users
            })
        
        return {
            "revenue_trend": revenue_trend,
            "orders_by_status": orders_status_data,
            "top_products": top_products_data,
            "user_growth": user_growth
        }