# Offer Letter Portal - Claude Instructions

## Project Overview

Build a production-grade Offer Letter Portal based strictly on the PRD.

Users:

* HR Admin
* Candidate

Core Features:

* Authentication (JWT)
* HR Dashboard
* Question Management
* Offer Letter Upload
* Watermarked PDF Viewing
* Candidate Question Responses
* Digital Signature
* Final Submission Workflow
* Electron Desktop App Protection
* Supabase Storage Integration

---

## Tech Stack

Frontend:

* React.js
* Tailwind CSS

Backend:

* FastAPI
* Python 3.12+

Database:

* Supabase PostgreSQL

Authentication:

* JWT Access Token
* JWT Refresh Token
* bcrypt Password Hashing

Storage:

* Supabase Storage

Desktop:

* Electron.js

Deployment:

* Vercel
* GitHub Actions CI/CD

---

## Coding Standards

* Follow Clean Architecture
* Follow SOLID Principles
* Use TypeScript for frontend
* Use Pydantic for request validation
* Use SQLAlchemy for database operations
* Write modular reusable code
* No hardcoded secrets
* Use environment variables
* Add proper error handling
* Add logging where required
* Generate production-ready code only

---

## Backend Structure

backend/

* api/
* routes/
* services/
* repositories/
* models/
* schemas/
* middleware/
* utils/
* config/
* tests/

Use:

* FastAPI Routers
* Dependency Injection
* JWT Middleware
* Service Layer Pattern
* Repository Pattern

---

## Frontend Structure

frontend/

* pages/
* components/
* layouts/
* hooks/
* services/
* contexts/
* types/
* utils/

Requirements:

* Responsive UI
* Tailwind CSS
* Protected Routes
* Form Validation
* API Layer Separation

---

## Security Requirements

Implement:

* JWT Authentication
* Role Based Access Control
* Supabase RLS
* HTTP Only Cookies
* Password Hashing (bcrypt)
* Private Storage Buckets
* Signed URLs
* HTTPS Enforcement
* Rate Limiting
* CORS Restrictions

Never expose:

* Bucket Paths
* Secret Keys
* Service Role Keys

---

## Offer Letter Requirements

* PDF Upload
* PDF Watermarking
* Private Storage
* Signed URL Access
* No Public File Access

Watermark:

* CONFIDENTIAL
* Candidate Name
* Every Page

---

## Candidate Requirements

* Answer Questions
* Auto Save Responses
* View Offer Letter
* Draw Signature
* Type Signature
* Submit Acceptance

Submission allowed only when:

* All Questions Answered
* Signature Provided

---

## Electron Requirements

Implement:

* Secure Viewer
* Content Protection
* Screenshot Detection
* Screen Recording Detection

Block:

* Print Screen
* Screen Capture APIs

---

## API Requirements

Generate:

* Request Schemas
* Response Schemas
* Validation
* Error Responses
* OpenAPI Documentation

Follow REST standards.

---

## Database Requirements

Generate:

* Users Table
* Questions Table
* Offer Letters Table
* Answers Table
* Submissions Table

Use:

* UUID Primary Keys
* Foreign Keys
* Indexes
* Row Level Security

---

## Development Rules

Before writing code:

1. Analyze requirement.
2. Explain implementation approach.
3. Generate folder structure.
4. Generate code.
5. Explain deployment steps.
6. Include test cases.

Always prefer maintainability, scalability, and security over shortcuts.
