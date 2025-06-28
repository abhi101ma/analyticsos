# AnalyticsOS - AI-powered Analytics Platform

A comprehensive full-stack analytics platform that connects to databases, auto-discovers schemas, defines business metrics, and provides AI-powered insights through natural language queries.

## 🚀 Features

### Core Analytics
- **Database Connectivity**: Connect to PostgreSQL and MySQL databases
- **Schema Discovery**: Auto-discover and visualize database schemas with ER diagrams
- **Business Metrics**: Define, store, and version control business metrics (AOV, LTV, etc.)
- **Interactive Dashboards**: Drag-and-drop dashboard builder with charts, tables, and maps

### AI-Powered Insights
- **Natural Language Queries**: Ask questions in plain English
- **SQL Generation**: Automatic SQL query generation from natural language
- **Visual Analytics**: AI-generated charts and visualizations
- **Business Intelligence**: Smart insights and recommendations

### Technical Stack
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL
- **Frontend**: React, TypeScript, TailwindCSS, Recharts
- **AI Integration**: Ready for OpenAI/Gemini API integration
- **Deployment**: Docker, Railway-ready

## 🛠️ Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Option 1: Docker Compose (Recommended)

1. **Clone and start the application**:
```bash
git clone <repository-url>
cd analytics-os
docker-compose up -d
```

2. **Access the application**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Option 2: Local Development

1. **Start PostgreSQL**:
```bash
docker run -d \
  --name analytics-postgres \
  -e POSTGRES_DB=analytics \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15-alpine
```

2. **Setup Backend**:
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

3. **Setup Frontend**:
```bash
npm install
npm run dev
```

## 📊 Sample Data

The application comes with pre-populated eCommerce sample data including:
- **Users**: Customer profiles and registration data
- **Products**: Product catalog with categories and pricing
- **Orders**: Transaction history with various statuses
- **Metrics**: Pre-defined business metrics (AOV, LTV, conversion rates)

### Sample Metrics Included:
- Monthly Recurring Revenue (MRR)
- Average Order Value (AOV)
- Customer Lifetime Value (CLV)
- Conversion Rate
- Top Products by Revenue

## 🎯 Usage Guide

### 1. Database Connections
- Navigate to **Datasets** tab
- Add new database connections (PostgreSQL/MySQL)
- Test connections and auto-discover schemas

### 2. Schema Explorer
- View database tables and relationships
- Explore column types and constraints
- Understand data relationships through ER diagrams

### 3. Business Metrics
- Define custom SQL-based metrics
- Version control metric definitions
- Schedule and run metric calculations
- View historical metric results

### 4. AI Copilot
- Click the **AI Copilot** button
- Ask natural language questions like:
  - "Show me revenue trends for the last 30 days"
  - "What are my top-selling products?"
  - "Calculate average order value"
  - "How many active customers do I have?"

### 5. Dashboard Analytics
- View real-time KPI cards
- Interactive charts and visualizations
- Revenue trends and growth metrics
- Customer and product analytics

## 🚀 Deployment

### Railway Deployment

1. **Connect your repository to Railway**
2. **Set environment variables**:
```bash
DATABASE_URL=your_postgresql_connection_string
```
3. **Deploy**: Railway will automatically build and deploy using the included `railway.json` configuration

### Custom Domain
- Configure custom domain in Railway dashboard
- SSL certificates are automatically managed

### Environment Variables
Copy `.env.example` to `.env` and configure:
```bash
DATABASE_URL=postgresql://user:password@host:port/database
OPENAI_API_KEY=your_openai_key  # Optional
GEMINI_API_KEY=your_gemini_key  # Optional
```

## 🔧 API Documentation

### Key Endpoints:
- `GET /api/datasets` - List database connections
- `POST /api/datasets` - Add new database connection
- `GET /api/metrics` - List business metrics
- `POST /api/metrics` - Create new metric
- `POST /api/chat` - AI chat interface
- `GET /api/metrics/dashboard` - Dashboard KPIs

Full API documentation available at: `http://localhost:8000/docs`

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  FastAPI Backend │    │   PostgreSQL    │
│                 │    │                 │    │                 │
│ • Dashboard     │◄──►│ • REST APIs     │◄──►│ • Sample Data   │
│ • Schema Explorer│    │ • AI Chat       │    │ • Metrics Store │
│ • Metrics UI    │    │ • SQL Execution │    │ • Results Cache │
│ • AI Chat       │    │ • Data Processing│    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🤖 AI Integration

The platform is designed to integrate with AI services:

### Current Implementation:
- Keyword-based response system (demo mode)
- SQL query generation templates
- Sample chart data generation

### Production AI Integration:
```python
# Add to backend/app/routers/chat.py
import openai
# or
import google.generativeai as genai

# Implement actual AI query processing
```

## 📈 Extending the Platform

### Adding New Metrics:
1. Navigate to Metrics tab
2. Define SQL query for your metric
3. Set category and description
4. Test and activate the metric

### Custom Visualizations:
- Extend `src/components/` with new chart types
- Use Recharts library for consistent styling
- Add to dashboard layout system

### Database Support:
- Extend `backend/app/database.py` for new database types
- Add connection drivers to `requirements.txt`
- Update schema introspection logic

## 🔒 Security Considerations

- Database credentials are encrypted in storage
- API endpoints use proper authentication (extend as needed)
- SQL injection protection through parameterized queries
- CORS configuration for production deployment

## 🐛 Troubleshooting

### Common Issues:

1. **Database Connection Failed**:
   - Check DATABASE_URL format
   - Ensure database is accessible
   - Verify credentials

2. **Frontend Not Loading**:
   - Check if backend is running on port 8000
   - Verify proxy configuration in vite.config.ts

3. **Docker Issues**:
   - Run `docker-compose down -v` to reset volumes
   - Check Docker daemon is running
   - Verify port availability

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/docs`
- Review the troubleshooting section above

---

**AnalyticsOS** - Transform your data into actionable insights with AI-powered analytics! 🚀📊