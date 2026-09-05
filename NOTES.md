# SettleFlow — project notes

Running log of decisions, progress, and architecture.

## What this project is
A complete, self-contained payment orchestration platform for iGaming/PSP merchants: routes transactions across embedded payment providers (Alpha, Beta, Gamma), retries on failure via Resilience4j circuit breakers, and reconciles internal records against PSP settlement ledgers.

## Streamlined Architecture (All-in-One Backend)
- **Frontend**: Next.js 14 + TypeScript + Tailwind (deployed on Vercel / `http://localhost:3000`)
- **All-in-One Backend**: Spring Boot 3.3 (`backend/` — `http://localhost:8080`)
  - **Payment Router & State Machine**: Smart rule matching, retries, and idempotency.
  - **Embedded Mock PSP Engine**: Self-contained Alpha, Beta, Gamma simulation with configurable latency, failure rates, and settlement ledgers.
  - **Resilience4j Circuit Breakers**: `CLOSED`, `OPEN`, `HALF_OPEN` state handling.
  - **In-Process Reconciliation Engine**: Audits database transactions against settlement ledgers, classifies discrepancies, and handles resolutions.
  - **Embedded / PostgreSQL DB**: Automatic schema generation and seed data.
  - **Universal CORS**: Built-in support for Vercel and local development.

## Quick Start Commands

1. **Start Backend (All-in-One)** (Terminal 1):
   ```bash
   cd backend
   .\mvnw.cmd spring-boot:run
   ```

2. **Start Frontend (Optional local dev)** (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Or Deploy via Docker Compose**:
   ```bash
   docker compose up -d
   ```
