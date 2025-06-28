from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import random
import json

router = APIRouter()

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    sql_query: Optional[str] = None
    chart_data: Optional[Dict[str, Any]] = None

@router.post("/", response_model=ChatResponse)
async def chat_with_ai(chat_message: ChatMessage):
    """Process chat message and return AI response"""
    message = chat_message.message.lower()
    
    # Simple keyword-based responses (in production, use OpenAI/Gemini API)
    if any(word in message for word in ['revenue', 'sales', 'money', 'income']):
        return ChatResponse(
            response="Based on your data, here's the revenue analysis. The total revenue for the last 30 days shows a positive trend with some seasonal variations.",
            sql_query="SELECT SUM(total_amount) as total_revenue FROM orders WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '30 days'",
            chart_data={
                "type": "line",
                "data": [
                    {"date": "2024-01-01", "value": 12500},
                    {"date": "2024-01-02", "value": 13200},
                    {"date": "2024-01-03", "value": 11800},
                    {"date": "2024-01-04", "value": 14500},
                    {"date": "2024-01-05", "value": 15200}
                ]
            }
        )
    
    elif any(word in message for word in ['orders', 'purchases', 'transactions']):
        return ChatResponse(
            response="Here's your order analysis. I can see the order patterns and status distribution across different time periods.",
            sql_query="SELECT status, COUNT(*) as count FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' GROUP BY status",
            chart_data={
                "type": "pie",
                "data": [
                    {"name": "Completed", "value": 45},
                    {"name": "Pending", "value": 12},
                    {"name": "Shipped", "value": 23},
                    {"name": "Cancelled", "value": 8}
                ]
            }
        )
    
    elif any(word in message for word in ['customers', 'users', 'people']):
        return ChatResponse(
            response="Your customer metrics show healthy growth patterns. Here's the user engagement and acquisition data.",
            sql_query="SELECT COUNT(DISTINCT user_id) as active_users FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'",
            chart_data={
                "type": "bar",
                "data": [
                    {"category": "New Users", "value": 156},
                    {"category": "Returning Users", "value": 234},
                    {"category": "Active Users", "value": 189},
                    {"category": "Churned Users", "value": 23}
                ]
            }
        )
    
    elif any(word in message for word in ['products', 'items', 'inventory']):
        return ChatResponse(
            response="Here's your product performance analysis. I can show you the top-selling products and inventory insights.",
            sql_query="SELECT p.name, SUM(oi.quantity) as total_sold FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.id, p.name ORDER BY total_sold DESC LIMIT 5",
            chart_data={
                "type": "bar",
                "data": [
                    {"name": "Laptop Pro", "sales": 45},
                    {"name": "Wireless Headphones", "sales": 38},
                    {"name": "Smartphone", "sales": 32},
                    {"name": "Coffee Maker", "sales": 28},
                    {"name": "Running Shoes", "sales": 25}
                ]
            }
        )
    
    elif any(word in message for word in ['aov', 'average order value', 'order value']):
        return ChatResponse(
            response="The Average Order Value (AOV) analysis shows your customers' spending patterns. Here's the breakdown by time period.",
            sql_query="SELECT AVG(total_amount) as avg_order_value FROM orders WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '30 days'",
            chart_data={
                "type": "line",
                "data": [
                    {"period": "Week 1", "aov": 125.50},
                    {"period": "Week 2", "aov": 132.20},
                    {"period": "Week 3", "aov": 118.80},
                    {"period": "Week 4", "aov": 145.30}
                ]
            }
        )
    
    elif any(word in message for word in ['help', 'what can you do', 'capabilities']):
        return ChatResponse(
            response="""I'm your AI analytics copilot! I can help you with:

📊 **Data Analysis**: Ask about revenue, orders, customers, or products
🔍 **SQL Queries**: I'll generate SQL queries for your questions  
📈 **Visualizations**: Create charts and graphs from your data
📋 **Metrics**: Calculate KPIs like AOV, LTV, conversion rates
🎯 **Insights**: Provide business insights and recommendations

Try asking me things like:
- "Show me revenue trends"
- "What are my top products?"
- "How many active customers do I have?"
- "Calculate average order value"
- "Show me order status breakdown"
            """)
    
    else:
        # Generic response for unrecognized queries
        sample_responses = [
            "I can help you analyze that data. Could you be more specific about what metrics you'd like to see?",
            "Let me look into your data for that information. What specific time period are you interested in?",
            "That's an interesting question! I can generate insights about your business data. What would you like to focus on?",
            "I'd be happy to help with that analysis. Could you clarify which data points you're most interested in?"
        ]
        
        return ChatResponse(
            response=random.choice(sample_responses),
            sql_query="SELECT COUNT(*) as total_records FROM orders",
        )