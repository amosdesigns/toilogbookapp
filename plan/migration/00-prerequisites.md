# Migration Prerequisites

**Last Updated**: 2025-12-30

Before starting the migration from Next.js to FastAPI + AWS, ensure you have the following tools, accounts, and knowledge.

## Required Tools & Software

### Python Environment
- [ ] **Python 3.12+** installed
  ```bash
  python --version  # Should be 3.12 or higher
  ```
- [ ] **pip** (Python package manager)
  ```bash
  pip --version
  ```
- [ ] **virtualenv** or **venv** for virtual environments
  ```bash
  pip install virtualenv
  ```
- [ ] **Poetry** (optional, for better dependency management)
  ```bash
  pip install poetry
  ```

### AWS Tools
- [ ] **AWS Account** (free tier eligible)
  - Sign up at: https://aws.amazon.com/
- [ ] **AWS CLI** installed and configured
  ```bash
  aws --version
  # Install: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
  ```
- [ ] **AWS CLI configured** with credentials
  ```bash
  aws configure
  # Enter: Access Key ID, Secret Access Key, Region (us-east-1), Output (json)
  ```
- [ ] **AWS SAM CLI** (for local Lambda testing)
  ```bash
  sam --version
  # Install: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html
  ```

### Database Tools
- [ ] **PostgreSQL** installed locally (for development)
  ```bash
  psql --version
  # macOS: brew install postgresql
  ```
- [ ] **Database GUI** (optional but helpful)
  - Options: pgAdmin, DBeaver, TablePlus, Postico

### API Testing Tools
- [ ] **Postman** or **Insomnia** (for testing API endpoints)
- [ ] **cURL** (usually pre-installed)
  ```bash
  curl --version
  ```

### Code Editor Setup
- [ ] **VS Code** (recommended) with extensions:
  - Python (Microsoft)
  - Pylance (Microsoft)
  - Python Debugger (Microsoft)
  - SQLAlchemy Stubs
  - AWS Toolkit
- [ ] **Python formatter** configured
  ```bash
  pip install black  # Code formatter
  pip install ruff   # Linter
  ```

## Required Accounts

- [ ] **AWS Account** (free tier)
  - URL: https://aws.amazon.com/
  - Free tier includes: 1M Lambda requests/month, 750hrs of RDS

- [ ] **Clerk Account** (already have)
  - Ensure you have access to:
    - API keys
    - JWKS endpoint
    - User management

- [ ] **Supabase Account** (already have)
  - Database connection string
  - Or prepare to migrate to AWS RDS

- [ ] **RapidAPI Account** (optional, for later)
  - URL: https://rapidapi.com/
  - Provider account (for hosting APIs)

## Required Knowledge

### Must Know (Start Here)
- [ ] **Python Basics**
  - Variables, functions, classes
  - List/dict comprehensions
  - f-strings
  - **Resource**: [Python Tutorial](https://docs.python.org/3/tutorial/)

- [ ] **Async/Await in Python**
  - `async def`, `await`
  - asyncio basics
  - **Resource**: [Real Python - Async IO](https://realpython.com/async-io-python/)

- [ ] **Type Hints in Python**
  - Function annotations: `def func(x: int) -> str:`
  - Pydantic models
  - **Resource**: [Python Type Hints](https://docs.python.org/3/library/typing.html)

- [ ] **REST API Concepts**
  - HTTP methods (GET, POST, PUT, DELETE)
  - Status codes (200, 201, 400, 401, 404, 500)
  - JSON request/response
  - **Resource**: [REST API Tutorial](https://restfulapi.net/)

### Should Know (Learn as You Go)
- [ ] **FastAPI Basics**
  - Path operations
  - Dependency injection
  - Request/response models
  - **Resource**: [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)

- [ ] **SQLAlchemy ORM**
  - Defining models
  - Querying database
  - Relationships
  - **Resource**: [SQLAlchemy Tutorial](https://docs.sqlalchemy.org/en/20/tutorial/)

- [ ] **AWS Lambda Basics**
  - Serverless concepts
  - Lambda functions
  - Cold starts
  - **Resource**: [AWS Lambda Docs](https://docs.aws.amazon.com/lambda/)

- [ ] **AWS API Gateway**
  - REST API setup
  - CORS configuration
  - Integration with Lambda
  - **Resource**: [API Gateway Docs](https://docs.aws.amazon.com/apigateway/)

### Nice to Have (Optional)
- [ ] **Docker** (for local development)
  ```bash
  docker --version
  ```
- [ ] **Infrastructure as Code**
  - AWS SAM templates
  - Or Terraform
- [ ] **CI/CD Concepts**
  - GitHub Actions
  - AWS CodePipeline

## Environment Setup Checklist

### 1. Create Python Virtual Environment
```bash
# Navigate to project root
cd /path/to/toilogbookapp

# Create backend directory
mkdir backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Verify activation (should show path to venv)
which python
```

### 2. Install FastAPI and Dependencies
```bash
# Core dependencies
pip install fastapi[all]  # Includes uvicorn, validation, etc.
pip install sqlalchemy
pip install alembic  # Database migrations
pip install asyncpg  # PostgreSQL async driver
pip install python-jose[cryptography]  # JWT
pip install passlib[bcrypt]  # Password hashing
pip install python-multipart  # Form data
pip install requests  # HTTP client

# AWS deployment
pip install mangum  # AWS Lambda adapter

# Development tools
pip install pytest
pip install pytest-asyncio
pip install black  # Code formatter
pip install ruff  # Linter

# Save dependencies
pip freeze > requirements.txt
```

### 3. Setup Local PostgreSQL Database
```bash
# Create development database
createdb toi_logbook_dev

# Or use Supabase connection string
# DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

### 4. Configure AWS CLI
```bash
# Run AWS configure
aws configure

# Enter your credentials
AWS Access Key ID: [Your Access Key]
AWS Secret Access Key: [Your Secret Key]
Default region name: us-east-1
Default output format: json

# Test configuration
aws sts get-caller-identity
```

### 5. Install AWS SAM CLI
```bash
# macOS
brew install aws-sam-cli

# Verify installation
sam --version
```

### 6. Setup Environment Variables
```bash
# Create .env file in backend/
cat > .env << EOF
DATABASE_URL=postgresql://user:pass@localhost:5432/toi_logbook_dev
CLERK_DOMAIN=your-clerk-domain.clerk.accounts.dev
CLERK_AUDIENCE=your-audience
AWS_REGION=us-east-1
ENVIRONMENT=development
EOF
```

## Verification Steps

Run these commands to verify your setup:

```bash
# Python version
python --version
# Expected: Python 3.12.x or higher

# Virtual environment
which python
# Expected: /path/to/backend/venv/bin/python

# FastAPI installed
python -c "import fastapi; print(fastapi.__version__)"
# Expected: Version number (e.g., 0.104.0)

# AWS CLI configured
aws sts get-caller-identity
# Expected: Your AWS account details

# PostgreSQL running
psql -U postgres -c "SELECT version();"
# Expected: PostgreSQL version info
```

## Learning Resources

### FastAPI
- 📚 [Official Tutorial](https://fastapi.tiangolo.com/tutorial/) - Start here
- 📚 [Full Stack FastAPI Template](https://github.com/tiangolo/full-stack-fastapi-template) - Reference implementation
- 📺 [FastAPI Course (YouTube)](https://www.youtube.com/watch?v=7t2alSnE2-I) - 19-hour comprehensive course

### Python
- 📚 [Real Python](https://realpython.com/) - Excellent tutorials
- 📚 [Python Type Hints](https://mypy.readthedocs.io/en/stable/cheat_sheet_py3.html) - Quick reference

### AWS
- 📚 [AWS Free Tier](https://aws.amazon.com/free/) - What's included
- 📚 [AWS Lambda + FastAPI](https://www.eliasbrange.dev/posts/deploy-fastapi-on-aws-lambda/) - Deployment guide
- 📺 [AWS Basics (YouTube)](https://www.youtube.com/watch?v=ubCNZRNjhyo) - 1-hour intro

### SQLAlchemy
- 📚 [SQLAlchemy 2.0 Tutorial](https://docs.sqlalchemy.org/en/20/tutorial/) - Modern async patterns
- 📚 [SQLAlchemy ORM Patterns](https://docs.sqlalchemy.org/en/20/orm/index.html)

## Common Issues & Solutions

### Issue: Python not found after installation
**Solution**: Make sure Python is in your PATH
```bash
# macOS/Linux
export PATH="/usr/local/bin/python3:$PATH"

# Or use pyenv for version management
brew install pyenv
```

### Issue: AWS CLI permission denied
**Solution**: Check IAM permissions
- Ensure your AWS user has necessary permissions
- Minimum: Lambda, API Gateway, CloudWatch Logs

### Issue: PostgreSQL connection refused
**Solution**: Start PostgreSQL service
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

### Issue: Virtual environment not activating
**Solution**:
```bash
# Delete and recreate
rm -rf venv
python -m venv venv
source venv/bin/activate
```

## Next Steps

Once all prerequisites are met:
1. ✅ Verify all tools are installed
2. ✅ Create Python virtual environment
3. ✅ Install FastAPI dependencies
4. ✅ Configure AWS CLI
5. ✅ Setup local database
6. ➡️ Proceed to: `01-setup-fastapi.md`

## Questions?

If you encounter issues or have questions about prerequisites:
- AWS: [AWS Documentation](https://docs.aws.amazon.com/)
- FastAPI: [FastAPI Discord](https://discord.gg/VQjSZaeJmf)
- Python: [Python Discord](https://discord.gg/python)
