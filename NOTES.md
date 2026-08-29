# SettleFlow — project notes

Running log of decisions, progress, and what's next. Update this as we go.

## What this project is
A complete payment orchestration platform for iGaming/PSP merchants: routes transactions
across mock payment providers, retries on failure via a circuit breaker, and
reconciles internal records against PSP settlement reports.

## Tech stack & Port allocations (Native Execution)
- **Frontend**: Next.js 14 + TypeScript + Tailwind — `http://localhost:3000`
- **Backend**: Spring Boot 3.3 + H2 / PostgreSQL — `http://localhost:8080`
- **Mock PSP Microservices**: Node.js Standalone (`psp-mocks/`)
  - **PSP Alpha**: `http://localhost:8081` (Fast tier-1, 5% failure rate, ~120ms latency)
  - **PSP Beta**: `http://localhost:8082` (Unstable provider, 60% failure rate, ~750ms latency)
  - **PSP Gamma**: `http://localhost:8083` (Multi-currency, 15% failure rate, ~250ms latency)
- **Reconciliation Worker**: Standalone Python script (`reconciliation/reconcile.py`) & Spring Boot integrated service
- **Resilience**: Resilience4j Circuit Breakers (`psp-alpha`, `psp-beta`, `psp-gamma`) with circuit-aware rule routing

## Quick Start Commands (No Docker)

1. **Start Mock PSPs** (Terminal 1):
   ```bash
   cd psp-mocks
   node server.js
   ```

2. **Start Backend** (Terminal 2):
   ```bash
   cd backend
   .\mvnw.cmd spring-boot:run
   ```

3. **Start Frontend** (Terminal 3):
   ```bash
   cd frontend
   npm run dev
   ```

4. **Run Standalone Reconciliation Audit** (Terminal 4):
   ```bash
   cd reconciliation
   python reconcile.py
   ```

---

## Progress Log

### 1. Mock PSP Microservices Built (`psp-mocks/`)
- Zero-dependency Node.js HTTP servers running Alpha (8081), Beta (8082), Gamma (8083).
- Configurable failure rates, latency simulation with jitter, and live `/configure` endpoint.
- In-memory settlement ledgers exposed via `/settlement-report`.

### 2. Backend Resilience4j, Circuit-Aware Routing & HTTP Client
- `HttpPspClient` created using Spring `RestClient` with timeout protection and fallback.
- Resilience4j `CircuitBreakerRegistry` configured for `psp-alpha`, `psp-beta`, `psp-gamma`.
- `PspRouter` upgraded with smart rule matching (currency, amount, weights) and dynamic circuit health bypass (`OPEN` $\to$ skip).

### 3. Extended Backend REST APIs & Seed Data
- `PspController`: `/api/psps`, `/api/psps/{id}/circuit-override`, `/api/psps/{id}/configure`.
- `RoutingRuleController`: Full CRUD for `/api/routing-rules`.
- `ReconciliationController` & `ReconciliationService`: `/api/reconciliation/run`, `/runs`, `/discrepancies`, and `/resolve`.
- `TransactionController`: `/api/transactions`, `/api/transactions/{id}`, `/refund`.
- `PlayerController` & `AuditLogController`: KYC limit/tier management and compliance logs.
- `DataInitializer`: Auto-seeds transactions, routing rules, players, and audit logs on startup.

### 4. Reconciliation Engine (`reconciliation/`)
- Standalone Python worker (`reconcile.py`) auditing internal records against PSP settlement reports.
- Accurately classifies: `MATCHED`, `MISSING_IN_DB`, `MISSING_IN_PSP`, `AMOUNT_MISMATCH`, `STATUS_MISMATCH`.
- Generates structured `reconciliation_report.json`.

### 5. Frontend UI & Live API Integration
- `frontend/lib/api-client.ts` wired to all backend endpoints with offline fallback.
- `checkout/page.tsx` connected to live deposit transaction orchestration.
- `dashboard/page.tsx` updated with live provider synchronization and circuit toggle handlers.
- Created `frontend/.eslintrc.json` for linting.
