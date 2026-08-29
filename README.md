# SettleFlow — Intelligent Payment Orchestration Platform

SettleFlow is an enterprise payment orchestration platform designed for high-volume merchants and iGaming operators. It dynamically routes transactions across multiple Payment Service Providers (PSPs), implements circuit-breaking resilience with automated failover, and reconciles internal ledgers against PSP settlement reports.

---

## 🏗️ Architecture & Component Overview

```mermaid
flowchart TD
    Player[Player / Checkout UI] -->|POST /api/transactions| Backend[SettleFlow Spring Boot Backend :8080]
    Admin[Ops Dashboard :3000] -->|Manage Rules, Circuits, Recon| Backend

    subgraph Backend Core
        TxService[Transaction Service & State Machine]
        PspRouter[Circuit-Aware Router]
        ReconEngine[Reconciliation Service]
        Resilience[Resilience4j CircuitBreakers]
    end

    TxService --> PspRouter
    PspRouter --> Resilience
    Resilience -->|HTTP /v1/payments| Alpha[PSP Alpha :8081]
    Resilience -->|HTTP /v1/charges| Beta[PSP Beta :8082]
    Resilience -->|HTTP /v2/settle| Gamma[PSP Gamma :8083]

    ReconEngine -->|Fetch /settlement-report| Alpha
    ReconEngine -->|Fetch /settlement-report| Beta
    ReconEngine -->|Fetch /settlement-report| Gamma
```

### System Components:
1. **Frontend (`frontend/`)**: Next.js 14 (App Router) + TypeScript + Tailwind CSS providing:
   - **Checkout Portal (`/checkout`)**: Multi-currency deposit & withdrawal flows with live status tracking.
   - **Operations Dashboard (`/dashboard`)**: Real-time transaction monitoring, manual circuit breaker overrides (kill switches), routing rules engine, player KYC limits, audit logging, and automated reconciliation auditor.
2. **Backend Orchestrator (`backend/`)**: Spring Boot 3.3 + Java 17 + JPA (H2 / PostgreSQL):
   - **State Machine**: Enforces strict transitions (`PENDING` $\to$ `ROUTING` $\to$ `PROCESSING` $\to$ `SETTLED` / `RETRYING` $\to$ `FAILED` / `REFUNDED`).
   - **Resilience4j Circuit Breakers**: Configured per PSP instance (`psp-alpha`, `psp-beta`, `psp-gamma`). Fast-fails degraded PSPs and probes recovery in `HALF_OPEN` state.
   - **Circuit-Aware Routing Router**: Matches transaction currency, amount, and traffic weights while dynamically bypassing unhealthy PSPs.
   - **REST APIs**: Full CRUD for routing rules, circuit controls, transactions, KYC tiers, and reconciliation runs.
3. **Mock PSP Microservices (`psp-mocks/`)**: Standalone lightweight Node.js servers:
   - **PSP Alpha (`port: 8081`)**: Fast tier-1 provider (5% failure rate, ~120ms latency).
   - **PSP Beta (`port: 8082`)**: Unstable provider (60% failure rate, ~750ms latency) for demoing circuit trip & failover.
   - **PSP Gamma (`port: 8083`)**: Multi-currency regional provider (15% failure rate, ~250ms latency).
   - Live endpoints: `/configure` (adjust latency and failure rates on the fly), `/settlement-report` (ledger export for audit).
4. **Reconciliation Engine (`reconciliation/`)**:
   - Standalone Python CLI (`reconcile.py`) auditing internal database transactions against PSP settlement reports.
   - Accurately classifies: `MATCHED`, `MISSING_IN_DB`, `MISSING_IN_PSP`, `AMOUNT_MISMATCH`, `STATUS_MISMATCH`.

---

## 🚀 Quick Start Guide (Native / No Docker)

### Prerequisites
- **Node.js** 18+ and **npm**
- **Java 17+** (JDK)
- **Python 3.9+** (optional, for standalone reconciliation CLI)

### 1. Start Mock PSP Microservices
```bash
cd psp-mocks
node server.js
```
*Listens on ports 8081, 8082, and 8083.*

### 2. Start Spring Boot Backend
```bash
cd backend
# Windows:
.\mvnw.cmd spring-boot:run
# macOS/Linux:
./mvnw spring-boot:run
```
*Backend runs on `http://localhost:8080` (H2 database console available at `http://localhost:8080/h2-console`).*

### 3. Start Next.js Frontend
```bash
cd frontend
npm run dev
```
*Access UI at `http://localhost:3000` (Demo logins: `ops@settleflow.dev` / `player@settleflow.dev` with password `demo1234`).*

### 4. Run Reconciliation Audit
```bash
cd reconciliation
python reconcile.py
```
*Generates formatted terminal summary and `reconciliation_report.json`.*

---

## 📡 REST API Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/transactions` | Create transaction & drive state machine |
| `GET` | `/api/transactions` | List all transactions with status and PSP details |
| `GET` | `/api/transactions/{id}` | Get single transaction detail |
| `POST` | `/api/transactions/{id}/refund` | Issue customer refund |
| `GET` | `/api/psps` | Get registered PSPs with live CircuitBreaker metrics |
| `POST` | `/api/psps/{id}/circuit-override` | Manually flip circuit breaker (`OPEN`/`CLOSED`/`HALF_OPEN`) |
| `GET` | `/api/routing-rules` | List active routing rules |
| `POST` | `/api/routing-rules` | Create routing rule |
| `PUT` | `/api/routing-rules/{id}` | Update routing rule |
| `DELETE` | `/api/routing-rules/{id}` | Delete routing rule |
| `POST` | `/api/reconciliation/run` | Trigger settlement reconciliation run |
| `GET` | `/api/reconciliation/runs` | List historical reconciliation batches |
| `GET` | `/api/reconciliation/discrepancies` | List discrepancy items |
| `POST` | `/api/reconciliation/discrepancies/{id}/resolve` | Resolve discrepancy with audit notes |
| `GET` | `/api/players` | List player KYC tiers and spending limits |
| `GET` | `/api/audit-logs` | Retrieve platform compliance audit logs |

---

## 🛡️ License
MIT
