# ValReport — Firmware Validation Report Generator

> AI-powered report automation for platform validation engineers.

---

## The Problem

Firmware validation engineers spend **2–3 hours per cycle** manually writing stakeholder reports after every test run - copying numbers, formatting charts, summarizing failures. ValReport eliminates this entirely.

Upload a test result file → get a professional PDF report with AI-generated analysis, human review, and a full audit trail — in under 60 seconds.

---

## What It Does

1. **Ingests** JUnit XML, pytest JSON, or CSV test output from any framework
2. **Analyzes** pass rates, failure categories, risk scoring, and execution metrics
3. **Generates** an AI executive summary and risk assessment (Claude API, mock mode available)
4. **Requires human review** — engineers confirm or edit every AI section before approval
5. **Supports two-person workflow** — share a time-limited link with a lead engineer for external approval without requiring an account
6. **Exports** professional PDF and Word reports with charts, failure tables, and approval audit trail

---

## Architecture
React Frontend (TypeScript + Framer Motion)
│
│ REST API
▼
FastAPI Backend
│
├── Pipeline: Parser → Enricher → LLM → Charter → Renderer
├── Auth: JWT + bcrypt
├── Review: HITL approval + share token flow
└── Export: PDF (xhtml2pdf) + Word (python-docx)
│
▼
PostgreSQL + Redis (Docker)

---

## Human-in-the-Loop Design

Every AI-generated section is flagged with an **AI Generated** badge. Engineers must explicitly confirm or edit both the executive summary and risk assessment before the **Approve & Export** button unlocks. Approvals are timestamped and embedded in the final document footer.

For team workflows, engineers generate a time-limited share link. The lead reviewer opens it without needing an account, reads the report, enters their name, and approves. The approval is recorded in the database and reflected in the exported documents.

---

## Tech Stack

**Backend** — Python 3.13, FastAPI, SQLAlchemy, PostgreSQL, Pandas, Matplotlib, Anthropic SDK

**Frontend** — React 18, TypeScript, Framer Motion, Tailwind CSS, React Query, Zustand

**Infrastructure** — Docker, Docker Compose

---

## Quick Start

```bash
# 1. Start the database
docker compose up -d

# 2. Backend
cd backend
pip install -r requirements.txt
# Create .env — see Environment Variables below
uvicorn api.main:app --reload --port 8000

# 3. Frontend
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

---

## Environment Variables

```env
DATABASE_URL=postgresql://valreport:valreport_secret@localhost:5432/valreport_db
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-32-char-secret-key
ANTHROPIC_API_KEY=          # Leave empty for mock mode
ENVIRONMENT=development
FRONTEND_URL=http://localhost:5173
```

---

## Context

Built as part of an AI engineering portfolio targeting Platform Validation roles. Demonstrates end-to-end ML system design: data pipeline, LLM integration, human-in-the-loop workflows, and production-grade API development.