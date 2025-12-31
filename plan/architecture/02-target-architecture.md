# Target Architecture: FastAPI + AWS

**Last Updated**: 2025-12-30
**Status**: 📝 Planning

## Overview

The new architecture will decouple the frontend and backend:
- **Frontend**: Next.js (client-side only, deployed to Vercel)
- **Backend**: Python FastAPI (deployed to AWS Lambda)
- **API Gateway**: AWS API Gateway + RapidAPI
- **Auth**: Clerk (JWT validation in FastAPI)
- **Database**: PostgreSQL (Supabase or AWS RDS)

## Target Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Browser                               │
│  ┌──────────────────┐                ┌──────────────────┐           │
│  │   Public UI      │                │    Admin UI      │           │
│  │  (Mobile-first)  │                │ (Desktop-focused)│           │
│  └────────┬─────────┘                └────────┬─────────┘           │
└───────────┼──────────────────────────────────┼──────────────────────┘
            │                                  │
            │    HTTPS/JSON                   │
            │                                  │
            └──────────────┬───────────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │       Next.js 16 App         │
            │    (Client-Side Only)        │
            │      Deployed on Vercel      │
            │                              │
            │  ┌────────────────────────┐  │
            │  │   Clerk Auth Client    │  │
            │  │  (Get JWT Token)       │  │
            │  └───────────┬────────────┘  │
            │              │               │
            │  ┌───────────▼────────────┐  │
            │  │   API Client Layer     │  │
            │  │  (axios/fetch)         │  │
            │  │  + JWT in headers      │  │
            │  └───────────┬────────────┘  │
            └──────────────┼───────────────┘
                           │
                           │ HTTP/HTTPS + Authorization: Bearer <JWT>
                           │
                           ▼
            ┌──────────────────────────────┐
            │     AWS API Gateway          │
            │  (REST API Endpoint)         │
            │  + CORS Configuration        │
            │  + Request Validation        │
            │  + Rate Limiting             │
            └──────────────┬───────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
    ┌──────────────────┐   ┌──────────────────┐
    │   RapidAPI       │   │  Direct Access   │
    │  (Public API)    │   │ (Your Frontend)  │
    └──────────────────┘   └──────────────────┘
                │                     │
                └──────────┬──────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │      AWS Lambda              │
            │   (FastAPI via Mangum)       │
            │                              │
            │  ┌────────────────────────┐  │
            │  │  Clerk JWT Validator   │  │
            │  │  (Middleware)          │  │
            │  └───────────┬────────────┘  │
            │              │               │
            │  ┌───────────▼────────────┐  │
            │  │   FastAPI Routes       │  │
            │  │                        │  │
            │  │  /api/v1/duty-sessions │  │
            │  │  /api/v1/logs          │  │
            │  │  /api/v1/shifts        │  │
            │  │  /api/v1/users         │  │
            │  │  /api/v1/locations     │  │
            │  │  /api/v1/tours         │  │
            │  │  /api/v1/notifications │  │
            │  └───────────┬────────────┘  │
            │              │               │
            │  ┌───────────▼────────────┐  │
            │  │  SQLAlchemy ORM        │  │
            │  │  (Connection Pool)     │  │
            │  └───────────┬────────────┘  │
            └──────────────┼───────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │   PostgreSQL Database        │
            │   (Supabase or AWS RDS)      │
            │                              │
            │  Same schema as current      │
            └──────────────────────────────┘
```

## Technology Stack Comparison

| Layer | Current | Target |
|-------|---------|--------|
| **Frontend** | Next.js (SSR + Server Actions) | Next.js (Client-side only) |
| **Backend** | Next.js Server Actions | FastAPI on AWS Lambda |
| **ORM** | Prisma (TypeScript) | SQLAlchemy (Python) |
| **Auth** | Clerk (SSR) | Clerk (JWT validation) |
| **API** | None (internal only) | REST API (OpenAPI spec) |
| **Deployment** | Vercel | Frontend: Vercel, Backend: AWS Lambda |
| **Database** | Supabase PostgreSQL | Supabase or AWS RDS |

## New Components

### 1. FastAPI Backend

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum  # AWS Lambda adapter

app = FastAPI(
    title="TOI Marina Guard Logbook API",
    version="1.0.0",
    description="REST API for Town of Islip Marina Guard Logbook",
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc",  # ReDoc
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-app.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
from app.api.routes import (
    duty_sessions,
    logs,
    shifts,
    users,
    locations,
    tours,
)

app.include_router(duty_sessions.router, prefix="/api/v1")
app.include_router(logs.router, prefix="/api/v1")
app.include_router(shifts.router, prefix="/api/v1")
# ... more routers

# AWS Lambda handler
handler = Mangum(app)
```

### 2. Clerk JWT Validation Middleware

```python
# app/core/security.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
import requests
from jose import jwt, JWTError

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthCredentials = Depends(security)
):
    """Validate Clerk JWT and return user"""
    token = credentials.credentials

    try:
        # Get Clerk's public key (JWKS)
        jwks_url = f"https://{CLERK_DOMAIN}/.well-known/jwks.json"
        jwks = requests.get(jwks_url).json()

        # Verify JWT
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            audience=CLERK_AUDIENCE,
        )

        # Get user from database
        user = await get_user_by_clerk_id(payload["sub"])

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return user

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
```

### 3. SQLAlchemy Models (Python equivalent of Prisma)

```python
# app/models/user.py
from sqlalchemy import Column, String, DateTime, Enum
from app.db.base import Base
import enum

class UserRole(str, enum.Enum):
    GUARD = "GUARD"
    SUPERVISOR = "SUPERVISOR"
    ADMIN = "ADMIN"
    SUPER_ADMIN = "SUPER_ADMIN"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    clerk_id = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    username = Column(String, unique=True)
    first_name = Column(String)
    last_name = Column(String)
    role = Column(Enum(UserRole), default=UserRole.GUARD)
    created_at = Column(DateTime, default=datetime.utcnow)
    # ... more fields
```

### 4. Pydantic Schemas (API Request/Response)

```python
# app/schemas/log.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class LogCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str
    type: str  # INCIDENT, PATROL, etc.
    location_id: str
    severity: Optional[str] = None
    incident_time: Optional[datetime] = None
    # ... more fields

class LogResponse(BaseModel):
    id: str
    title: str
    description: str
    type: str
    status: str
    created_at: datetime
    updated_at: datetime
    location: LocationResponse
    user: UserResponse
    # ... more fields

    class Config:
        from_attributes = True  # Allows SQLAlchemy model → Pydantic
```

### 5. API Routes

```python
# app/api/routes/logs.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.core.security import get_current_user
from app.schemas.log import LogCreate, LogResponse
from app.services import log_service

router = APIRouter(prefix="/logs", tags=["logs"])

@router.get("", response_model=List[LogResponse])
async def get_logs(
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(get_current_user),
):
    """Get all logs (paginated)"""
    logs = await log_service.get_logs(skip=skip, limit=limit)
    return logs

@router.post("", response_model=LogResponse, status_code=201)
async def create_log(
    log_data: LogCreate,
    current_user = Depends(get_current_user),
):
    """Create a new log entry"""
    log = await log_service.create_log(log_data, user_id=current_user.id)
    return log

@router.get("/{log_id}", response_model=LogResponse)
async def get_log(
    log_id: str,
    current_user = Depends(get_current_user),
):
    """Get a single log by ID"""
    log = await log_service.get_log_by_id(log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return log

# ... more endpoints (update, delete, etc.)
```

## Authentication Flow (New)

```
1. User visits Next.js app
   ↓
2. Clerk checks authentication (client-side)
   ↓
3. If not authenticated → Redirect to Clerk sign-in
   ↓
4. If authenticated → Get JWT token from Clerk
   ↓
5. Frontend makes API request with JWT in Authorization header
   ↓
6. AWS API Gateway receives request
   ↓
7. Lambda (FastAPI) receives request
   ↓
8. Clerk JWT Validator middleware extracts and validates token
   ↓
9. Middleware fetches user from database using clerk_id from JWT
   ↓
10. Request proceeds with authenticated user context
   ↓
11. Route handler checks permissions (role-based)
   ↓
12. Performs database operation via SQLAlchemy
   ↓
13. Returns JSON response
   ↓
14. Frontend receives response and updates UI
```

## Frontend Changes

### Before (Server Action)
```typescript
// Current
import { createLog } from '@/lib/actions/log-actions'

const handleSubmit = async (data: LogFormData) => {
  const result = await createLog(data)

  if (!result.ok) {
    toast.error(result.message)
  } else {
    toast.success('Log created!')
  }
}
```

### After (API Call)
```typescript
// New
import { apiClient } from '@/lib/api/client'

const handleSubmit = async (data: LogFormData) => {
  try {
    const response = await apiClient.post('/api/v1/logs', data)
    toast.success('Log created!')
  } catch (error) {
    toast.error(error.message)
  }
}
```

### API Client Setup
```typescript
// lib/api/client.ts
import axios from 'axios'
import { useAuth } from '@clerk/nextjs'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

// Add JWT to all requests
apiClient.interceptors.request.use(async (config) => {
  const { getToken } = useAuth()
  const token = await getToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export { apiClient }
```

## AWS Infrastructure

### AWS Lambda Configuration
```yaml
# template.yaml (AWS SAM)
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  FastAPIFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: toi-logbook-api
      Runtime: python3.12
      Handler: app.main.handler
      MemorySize: 512
      Timeout: 30
      Environment:
        Variables:
          DATABASE_URL: !Ref DatabaseURL
          CLERK_DOMAIN: !Ref ClerkDomain
          CLERK_AUDIENCE: !Ref ClerkAudience
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Path: /{proxy+}
            Method: ANY
```

### API Gateway
- **Endpoint**: `https://api.example.com/v1/`
- **CORS**: Configured for your Next.js domain
- **Throttling**: 1000 requests/second (adjustable)
- **Auth**: Bearer token (JWT)

### Database Options

**Option 1: Keep Supabase** (Easier migration)
- ✅ No database migration needed
- ✅ Already configured and working
- ⚠️ Less AWS integration

**Option 2: Migrate to AWS RDS** (Better AWS integration)
- ✅ Better integration with Lambda (VPC, IAM)
- ✅ More control over configuration
- ⚠️ Requires database migration
- ⚠️ Potentially more expensive

## RapidAPI Integration

Once deployed to AWS, expose API via RapidAPI:

1. **Import OpenAPI Spec**: FastAPI auto-generates OpenAPI 3.0 spec
2. **Configure on RapidAPI**: Upload spec, set pricing, configure
3. **Public Endpoints**: Certain endpoints can be exposed publicly
4. **Private Endpoints**: Require RapidAPI key + Clerk JWT

## Deployment Strategy

### Phase 1: Parallel Deployment
- Keep Next.js monolith running (production)
- Deploy FastAPI to AWS (staging)
- Test API endpoints
- No frontend changes yet

### Phase 2: Incremental Migration
- Migrate one feature at a time (e.g., Logs)
- Frontend calls API instead of Server Action
- Test thoroughly before next feature
- Rollback capability at each step

### Phase 3: Full Migration
- All Server Actions migrated
- Frontend fully using API
- Decommission Server Actions
- Monitor and optimize

## Monitoring & Observability

- **AWS CloudWatch**: Lambda logs and metrics
- **API Gateway**: Request/response logs
- **Sentry**: Error tracking (both frontend and backend)
- **DataDog/New Relic**: Application performance monitoring (optional)

## Success Criteria

The new architecture should achieve:
- ✅ All 48 Server Actions converted to REST endpoints
- ✅ Clerk JWT authentication working in FastAPI
- ✅ Database operations working via SQLAlchemy
- ✅ Frontend successfully calling API
- ✅ Deployed to AWS Lambda
- ✅ OpenAPI spec available for RapidAPI
- ✅ Response times < 500ms (P95)
- ✅ Comprehensive test coverage
- ✅ Documentation complete

## Next Steps

1. Setup local FastAPI development environment
2. Create SQLAlchemy models matching Prisma schema
3. Implement Clerk JWT validation
4. Build first API endpoint (proof of concept)
5. Test frontend → API integration
6. Deploy to AWS Lambda (staging)
7. Repeat for all endpoints
