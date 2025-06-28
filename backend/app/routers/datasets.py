from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import asyncpg
from datetime import datetime
import uuid

from ..database import get_db_pool

router = APIRouter()

class DatasetCreate(BaseModel):
    name: str
    type: str  # postgresql, mysql
    host: str
    port: int
    database: str
    username: str
    password: str

class DatasetResponse(BaseModel):
    id: str
    name: str
    type: str
    host: str
    port: int
    database: str
    status: str
    tables_count: int
    created_at: datetime

@router.get("/", response_model=List[DatasetResponse])
async def get_datasets():
    """Get all datasets"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id, name, type, host, port, database_name as database, 
                   status, tables_count, created_at
            FROM datasets 
            ORDER BY created_at DESC
        """)
        
        return [dict(row) for row in rows]

@router.post("/", response_model=DatasetResponse)
async def create_dataset(dataset: DatasetCreate):
    """Create a new dataset connection"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        # In production, encrypt the password
        dataset_id = await conn.fetchval("""
            INSERT INTO datasets (name, type, host, port, database_name, username, password_encrypted, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
        """, dataset.name, dataset.type, dataset.host, dataset.port, 
            dataset.database, dataset.username, dataset.password, 'connected')
        
        # Get the created dataset
        row = await conn.fetchrow("""
            SELECT id, name, type, host, port, database_name as database,
                   status, tables_count, created_at
            FROM datasets WHERE id = $1
        """, dataset_id)
        
        return dict(row)

@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: str):
    """Delete a dataset"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        result = await conn.execute("DELETE FROM datasets WHERE id = $1", uuid.UUID(dataset_id))
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Dataset not found")
        return {"message": "Dataset deleted successfully"}

@router.post("/{dataset_id}/test")
async def test_connection(dataset_id: str):
    """Test dataset connection"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        # Update status to connected (simplified for demo)
        await conn.execute(
            "UPDATE datasets SET status = $1, updated_at = $2 WHERE id = $3",
            'connected', datetime.utcnow(), uuid.UUID(dataset_id)
        )
        return {"status": "connected", "message": "Connection successful"}

@router.get("/{dataset_id}/schema")
async def get_schema(dataset_id: str):
    """Get database schema for a dataset"""
    # This is a simplified schema response for demo purposes
    # In production, you would connect to the actual database and introspect the schema
    
    sample_schema = {
        "tables": [
            {
                "name": "users",
                "columns": [
                    {"name": "id", "type": "uuid", "nullable": False, "primary_key": True, "foreign_key": False},
                    {"name": "email", "type": "varchar(255)", "nullable": False, "primary_key": False, "foreign_key": False},
                    {"name": "first_name", "type": "varchar(100)", "nullable": True, "primary_key": False, "foreign_key": False},
                    {"name": "last_name", "type": "varchar(100)", "nullable": True, "primary_key": False, "foreign_key": False},
                    {"name": "created_at", "type": "timestamp", "nullable": True, "primary_key": False, "foreign_key": False},
                ],
                "relationships": [
                    {"from_table": "users", "from_column": "id", "to_table": "orders", "to_column": "user_id", "type": "one-to-many"}
                ]
            },
            {
                "name": "products",
                "columns": [
                    {"name": "id", "type": "uuid", "nullable": False, "primary_key": True, "foreign_key": False},
                    {"name": "name", "type": "varchar(255)", "nullable": False, "primary_key": False, "foreign_key": False},
                    {"name": "description", "type": "text", "nullable": True, "primary_key": False, "foreign_key": False},
                    {"name": "price", "type": "decimal(10,2)", "nullable": False, "primary_key": False, "foreign_key": False},
                    {"name": "category", "type": "varchar(100)", "nullable": True, "primary_key": False, "foreign_key": False},
                ],
                "relationships": [
                    {"from_table": "products", "from_column": "id", "to_table": "order_items", "to_column": "product_id", "type": "one-to-many"}
                ]
            },
            {
                "name": "orders",
                "columns": [
                    {"name": "id", "type": "uuid", "nullable": False, "primary_key": True, "foreign_key": False},
                    {"name": "user_id", "type": "uuid", "nullable": True, "primary_key": False, "foreign_key": True},
                    {"name": "total_amount", "type": "decimal(10,2)", "nullable": False, "primary_key": False, "foreign_key": False},
                    {"name": "status", "type": "varchar(50)", "nullable": True, "primary_key": False, "foreign_key": False},
                    {"name": "created_at", "type": "timestamp", "nullable": True, "primary_key": False, "foreign_key": False},
                ],
                "relationships": [
                    {"from_table": "orders", "from_column": "user_id", "to_table": "users", "to_column": "id", "type": "many-to-one"},
                    {"from_table": "orders", "from_column": "id", "to_table": "order_items", "to_column": "order_id", "type": "one-to-many"}
                ]
            },
            {
                "name": "order_items",
                "columns": [
                    {"name": "id", "type": "uuid", "nullable": False, "primary_key": True, "foreign_key": False},
                    {"name": "order_id", "type": "uuid", "nullable": True, "primary_key": False, "foreign_key": True},
                    {"name": "product_id", "type": "uuid", "nullable": True, "primary_key": False, "foreign_key": True},
                    {"name": "quantity", "type": "integer", "nullable": False, "primary_key": False, "foreign_key": False},
                    {"name": "unit_price", "type": "decimal(10,2)", "nullable": False, "primary_key": False, "foreign_key": False},
                ],
                "relationships": [
                    {"from_table": "order_items", "from_column": "order_id", "to_table": "orders", "to_column": "id", "type": "many-to-one"},
                    {"from_table": "order_items", "from_column": "product_id", "to_table": "products", "to_column": "id", "type": "many-to-one"}
                ]
            }
        ]
    }
    
    return sample_schema