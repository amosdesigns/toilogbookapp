# Migration Plan: Next.js → FastAPI + AWS

## Overview

This directory contains the comprehensive plan for migrating the Town of Islip Marina Guard Logbook application from a Next.js monolith (with Server Actions) to a decoupled architecture using:

- **Frontend**: Next.js (client-side only, no Server Actions)
- **Backend**: Python FastAPI on AWS Lambda
- **API Gateway**: AWS API Gateway + RapidAPI
- **Auth**: Clerk (keeping existing, migrate to AWS Cognito later if needed)
- **Database**: PostgreSQL (Supabase, potentially migrate to AWS RDS)

## Current Status

**Phase**: Planning & Documentation
**Last Updated**: 2025-12-30

### Migration Progress

- [ ] Phase 0: Planning & Architecture (Current)
- [ ] Phase 1: Setup FastAPI Development Environment
- [ ] Phase 2: Database Migration (Prisma → SQLAlchemy)
- [ ] Phase 3: Auth Integration (Clerk → FastAPI middleware)
- [ ] Phase 4: API Development (Migrate Server Actions)
- [ ] Phase 5: Frontend Updates (Remove Server Actions, use API calls)
- [ ] Phase 6: AWS Deployment (Lambda + API Gateway)
- [ ] Phase 7: RapidAPI Integration
- [ ] Phase 8: Testing & Optimization

## Directory Structure

```
plan/
├── README.md                          # This file - overview and status
├── architecture/
│   ├── 01-current-architecture.md     # Document current Next.js setup
│   ├── 02-target-architecture.md      # Document target FastAPI + AWS setup
│   ├── 03-data-flow.md                # How data flows in both architectures
│   └── diagrams/                      # Architecture diagrams
├── migration/
│   ├── 00-prerequisites.md            # Tools, accounts, knowledge needed
│   ├── 01-setup-fastapi.md            # Setup local FastAPI development
│   ├── 02-database-migration.md       # Prisma → SQLAlchemy migration
│   ├── 03-auth-integration.md         # Clerk JWT validation in FastAPI
│   ├── 04-api-endpoints.md            # Converting Server Actions → REST
│   ├── 05-frontend-updates.md         # Updating Next.js to use APIs
│   ├── 06-aws-deployment.md           # Deploying to AWS Lambda
│   └── 07-rapidapi-setup.md           # RapidAPI integration
├── api-specs/
│   ├── openapi.yaml                   # OpenAPI 3.0 specification
│   ├── endpoints/                     # Detailed endpoint documentation
│   └── models/                        # Pydantic models (schemas)
├── current-state/
│   ├── server-actions-inventory.md    # All current Server Actions
│   ├── database-schema.md             # Current Prisma schema analysis
│   ├── auth-flow.md                   # Current Clerk auth flow
│   └── api-requirements.md            # What APIs we need to build
└── decisions/
    ├── 001-fastapi-choice.md          # Why FastAPI over Flask/Django
    ├── 002-keep-clerk.md              # Why keep Clerk (for now)
    ├── 003-aws-lambda.md              # Why Lambda over ECS/EC2
    └── template.md                    # Template for new decisions
```

## Key Decisions

| Decision | Status | Details |
|----------|--------|---------|
| Backend Framework | ✅ Decided | **FastAPI** - Modern, fast, great OpenAPI support |
| Auth Provider | ✅ Decided | **Keep Clerk** initially, migrate to Cognito later |
| AWS Compute | 🤔 Evaluating | **Lambda** (serverless) vs ECS (containers) |
| Database | 🤔 Evaluating | Keep **Supabase** or migrate to **AWS RDS** |
| ORM | 📝 Planned | **SQLAlchemy** (Python standard) |
| Migration Strategy | 📝 Planned | **Incremental** - feature by feature |

## Learning Goals

This migration is designed to teach:
- ✅ **Python**: FastAPI, async/await, type hints, Pydantic
- ✅ **AWS**: Lambda, API Gateway, RDS, IAM, CloudWatch
- ✅ **API Design**: REST, OpenAPI, versioning
- ✅ **DevOps**: CI/CD, infrastructure as code, monitoring

## Next Steps

1. **Document Current Architecture** (You are here 📍)
   - Inventory all Server Actions
   - Map database schema
   - Document auth flow

2. **Design Target Architecture**
   - Define API endpoints
   - Create OpenAPI spec
   - Plan AWS infrastructure

3. **Setup Development Environment**
   - Install Python, FastAPI
   - Setup local PostgreSQL
   - Configure AWS CLI

## Resources

### FastAPI
- [Official Docs](https://fastapi.tiangolo.com/)
- [Full Stack FastAPI Template](https://github.com/tiangolo/full-stack-fastapi-template)

### AWS
- [Lambda + API Gateway Tutorial](https://aws.amazon.com/blogs/compute/using-amazon-api-gateway-as-a-proxy-for-dynamodb/)
- [AWS SAM (Serverless Application Model)](https://aws.amazon.com/serverless/sam/)

### RapidAPI
- [Provider Documentation](https://docs.rapidapi.com/docs/provider-quick-start-guide)

## Questions & Decisions Needed

- [ ] Should we deploy to Lambda or ECS? (Cost vs Control)
- [ ] Keep Supabase or migrate to AWS RDS?
- [ ] Use AWS SAM, CDK, or Terraform for infrastructure?
- [ ] Which feature to migrate first as proof-of-concept?

## Contributing to This Plan

As we learn and make decisions, update the relevant documents:
1. Update status in this README
2. Add decision documents in `decisions/`
3. Keep architecture diagrams current
4. Document any blockers or issues
