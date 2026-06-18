# Offer Letter Portal — Avkalan.ai

A production-grade platform for HR teams to send, manage, and collect digitally-signed offer letters.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | FastAPI (Python 3.12) |
| Database | Supabase PostgreSQL (async SQLAlchemy) |
| Auth | JWT (access + refresh) + bcrypt |
| Storage | Supabase Storage (private bucket, signed URLs) |
| Desktop | Electron.js (content protection, screenshot blocking) |
| CI/CD | GitHub Actions + Vercel |

---

## Quick Start (Local Development)

### Prerequisites

- Python 3.12+
- Node.js 20+
- A free [Supabase](https://supabase.com) project

---

### 1. Clone the repository

```bash
git clone https://github.com/your-org/offer-letter-portal.git
cd offer-letter-portal
```

---

### 2. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate      # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Copy and fill environment variables
copy .env.example .env
# Edit .env with your real Supabase credentials

# Run database migrations
alembic upgrade head

# Start the backend
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

---

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env
# .env already has: VITE_API_URL=http://localhost:8000/api/v1

# Start dev server
npm run dev
```

Frontend available at: http://localhost:3000

---

### 4. Environment variables

**backend/.env**

```env
APP_ENV=development
APP_SECRET_KEY=your-secret-key-at-least-32-chars

# JWT (generate random secrets)
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Supabase — get these from your Supabase project settings
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql+asyncpg://postgres:password@db.xxxx.supabase.co:5432/postgres

# Storage
STORAGE_BUCKET_OFFER_LETTERS=offer-letters
```

**frontend/.env**

```env
VITE_API_URL=http://localhost:8000/api/v1
```

---

### 5. Supabase setup

1. Create a new Supabase project at https://supabase.com
2. Go to **Project Settings → Database** and copy your connection string
3. Go to **Storage** and create a private bucket named `offer-letters`
4. Run the SQL migrations in order:
   ```sql
   -- In Supabase SQL Editor, run each file:
   supabase/migrations/001_initial_schema.sql
   supabase/migrations/002_rls_policies.sql
   supabase/migrations/003_seed_data.sql
   ```
5. Or use Alembic locally against Supabase Postgres:
   ```bash
   cd backend
   alembic upgrade head
   ```

---

## Project Structure

```
offer-letter-portal/
├── backend/
│   ├── alembic/               # Database migrations
│   ├── api/routes/            # FastAPI route handlers
│   ├── config/                # Settings, DB, Storage
│   ├── middleware/            # JWT auth, error handlers
│   ├── models/                # SQLAlchemy ORM models
│   ├── repositories/          # Data access layer
│   ├── schemas/               # Pydantic request/response schemas
│   ├── services/              # Business logic
│   ├── tests/                 # pytest integration tests
│   ├── utils/                 # JWT, password, PDF utils
│   ├── main.py                # FastAPI app entry point
│   └── requirements.txt
│
├── frontend/
│   └── src/
│       ├── components/        # Reusable UI components
│       ├── contexts/          # AuthContext
│       ├── hooks/             # useAuth, useContentProtection
│       ├── pages/             # HR and Candidate pages
│       ├── services/          # API service layer
│       └── types/             # TypeScript types
│
├── electron/
│   └── src/
│       ├── main.js            # Electron main process
│       └── preload.js         # Context bridge
│
├── supabase/
│   └── migrations/            # SQL migration files
│
├── .github/workflows/         # CI/CD pipelines
└── docker-compose.yml
```

---

## Running Tests

```bash
cd backend

# Unit tests
pytest tests/test_utils.py tests/test_pdf_utils.py -v

# Integration tests (requires PostgreSQL)
# Make sure .env has a valid DATABASE_URL pointing to a test database
pytest tests/ -v --cov=. --cov-report=term-missing
```

---

## Docker (full stack)

```bash
# From project root
docker-compose up --build
```

Services:
- Backend: http://localhost:8000
- Frontend: http://localhost:3000

---

## Deployment

### Backend → Render / Railway / VPS

```bash
# Set all .env variables as environment variables in your hosting platform
# Start command:
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend → Vercel

```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel
# Set VITE_API_URL to your backend URL in Vercel environment variables
```

### Electron Desktop App

```bash
cd electron
npm install
npm run build        # builds for current platform
npm run build:win    # Windows installer (.exe)
npm run build:mac    # macOS (.dmg)
npm run build:linux  # Linux AppImage
```

---

## User Roles

| Role | Capabilities |
|---|---|
| **HR Admin** | Create questions, upload offer letters, manage candidates, review submissions |
| **Candidate** | View offer letter, answer questions, draw/type signature, submit acceptance |

### Default HR Admin (seed data)

After running `003_seed_data.sql`:

```
Email:    admin@avkalan.ai
Password: Admin@123
```

**Change this password immediately after first login.**

---

## Security Features

- JWT access tokens (60 min) + rotating refresh tokens (7 days)
- bcrypt password hashing (cost factor 12)
- Supabase Row-Level Security — candidates only see their own data
- PDF watermarking — every page stamped with CONFIDENTIAL + candidate name
- Signed URLs for private storage (expiry: 1 hour)
- Rate limiting (60 req/min per IP)
- Electron content protection (`setContentProtection(true)`)
- Screenshot/screen capture key detection and blocking
- CORS restricted to configured origins only

---

## API Reference

Full interactive docs at `/docs` (development mode only).

### Key endpoints

```
POST   /api/v1/auth/register        Public candidate registration
POST   /api/v1/auth/login           Login — returns access + refresh tokens
POST   /api/v1/auth/refresh         Rotate refresh token
POST   /api/v1/auth/logout          Revoke refresh token

GET    /api/v1/users/me             Own profile
POST   /api/v1/users                Create user (HR only)
GET    /api/v1/users/candidates     List candidates (HR only)

GET    /api/v1/questions/active     Active questions (all authenticated)
POST   /api/v1/questions            Create question (HR only)
PATCH  /api/v1/questions/:id        Update question (HR only)
DELETE /api/v1/questions/:id        Soft delete (HR only)

POST   /api/v1/offer-letters        Upload PDF (HR only, multipart)
GET    /api/v1/offer-letters/my     My offer letter (candidate)
GET    /api/v1/offer-letters/:id/signed-url  Get signed URL

PUT    /api/v1/answers/:questionId  Upsert single answer (candidate)
POST   /api/v1/answers/bulk         Bulk upsert answers (candidate)
GET    /api/v1/answers/me           My answers (candidate)

POST   /api/v1/submissions          Submit acceptance (candidate)
GET    /api/v1/submissions/me       My submission (candidate)
GET    /api/v1/submissions          All submissions (HR only)
PATCH  /api/v1/submissions/:id      Update status (HR only)
```

---

## License

Proprietary — Avkalan.ai. All rights reserved.
