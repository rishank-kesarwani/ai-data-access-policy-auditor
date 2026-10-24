# AI Data Access & Policy Auditor

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/Backend-NestJS%2011-red.svg)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black.svg)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Auditable policy evaluation for AI workflow data access, with explicit authorization rules, explainable allow/deny/escalate decisions, and privacy-focused access records.**

---

## Table of Contents
1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Key Product Features](#3-key-product-features)
4. [Deterministic Policy Evaluation Engine](#4-deterministic-policy-evaluation-engine)
5. [Cryptographic Tamper-Evident Audit Trail](#5-cryptographic-tamper-evident-audit-trail)
6. [Public Access & Security Governance (`PUBLIC_ACCESS_ENABLE`)](#6-public-access--security-governance-public_access_enable)
7. [Integrations: Real Contracts vs. Fallbacks](#7-integrations-real-contracts-vs-fallbacks)
8. [Persistence Strategy](#8-persistence-strategy)
9. [Environment Variables Reference](#9-environment-variables-reference)
10. [Deployment Guide](#10-deployment-guide)
    - [Render (Backend Web Service)](#render-backend-web-service)
    - [Vercel (Frontend Console)](#vercel-frontend-console)
11. [Local Development & Testing](#11-local-development--testing)
12. [Walkthrough Scenarios & Smoke Test Checklist](#12-walkthrough-scenarios--smoke-test-checklist)
13. [Troubleshooting & FAQ](#13-troubleshooting--faq)

---

## 1. Overview

As autonomous AI agents, fine-tuned models, and retrieval-augmented generation (RAG) pipelines proliferate across enterprise environments, granting blanket data access exposes organizations to data leakage, regulatory non-compliance, and untracked exposure of sensitive PII, financial, and healthcare records.

**AI Data Access & Policy Auditor** acts as an auditable policy evaluation layer for AI workflows. It provides:
- **Explicit Authorization Rules**: Fine-grained rules scoping AI workflows to specific data sources, actions (`READ`, `TRAIN`, `EMBED`, `FINE_TUNE`, `INFER`, `EXPORT`, `CACHE`), and business purposes.
- **Deterministic Policy Evaluation**: AI models never make authorization decisions. Decisions are computed by a deterministic engine with clear precedence and a safe default-deny baseline.
- **Three-Way Decision Outcomes**: Every request resolves strictly to **ALLOW**, **DENY**, or **ESCALATE** (for dual-custody human review).
- **Explainable Results**: Each decision articulates the matched rule, satisfied vs. failed compliance conditions (e.g. consent, PII tokenization, tenant boundary), unmet requirements, and an optional AI-synthesized natural language summary.
- **Cryptographic Tamper-Evident Audit Trail**: Every decision generates an immutable audit record chained via SHA-256 hashes (`recordHash = SHA256(prevHash:id:seq:timestamp:decision:isSimulation:matchedPolicy:requestHash)`), with automated integrity verification.
- **Clear Separation of Simulation vs. Enforcement**: Clear boundaries distinguish synthetic simulation evaluations from real authorization enforcement. The application does not claim to modify database or cloud IAM permissions without verified connectors.

---

## 2. Architecture

```mermaid
flowchart TD
    subgraph ClientLayer["Client Layer (Responsive 320px - 1440px)"]
        Browser["Desktop & Mobile Web Console\n(Next.js 14 App Router / React 18 / Vanilla CSS)"]
    end

    subgraph HostingFrontend["Vercel Edge Platform"]
        NextServer["Next.js SSR & Static Frontend\n(Deploys from frontend/ directory)"]
    end

    subgraph HostingBackend["Render Web Service"]
        NestApp["NestJS 11 Application\n(0.0.0.0:$PORT / Global Validation Pipe / Helmet / CORS)"]
        
        subgraph AuthAndSecurity["Security & Access Controls"]
            AuthGuard["CombinedAuthGuard\n(PUBLIC_ACCESS_ENABLE Flag + Bearer JWT + x-service-api-key)"]
            RateLimiter["ThrottlerGuard (Rate Limiting)"]
            Sanitizer["SanitizerUtil (Secret Redaction)"]
        end
        
        subgraph CoreEngines["Core Authorization & Governance Engines"]
            InventoryEngine["Inventory Registry\n(Workflows & Data Sources)"]
            PolicyEngine["Deterministic Evaluator\n(Precedence, Conditions, Safe Default-Deny)"]
            ApprovalEngine["Policy Approval Workflow\n(Draft -> Pending -> Active / Archived)"]
            AuditEngine["Cryptographic Audit Trail\n(SHA-256 Forward Hash Chain)"]
        end
    end

    subgraph SharedIntegrations["Shared Integrations & Persistence"]
        RailwayAI["Shared Railway AI Platform\nPOST /api/v1/ai/chat\n(Fallback: Deterministic Explainer)"]
        RailwayNotify["Shared Railway Notification Service\nPOST /v1/notifications\n(Fallback: Audit Log Dispatcher)"]
        RailwayRedis["Shared Railway Redis\n(Fallback: In-Memory TTL Cache)"]
        Database["MongoDB Cluster (Mongoose ODM)\n(Fallback: Atomic In-Memory Repository)"]
    end

    Browser -->|HTTPS| NextServer
    NextServer -->|REST API / Bearer JWT| NestApp
    NestApp --> AuthGuard
    AuthGuard --> RateLimiter
    RateLimiter --> CoreEngines
    CoreEngines -.->|Explain Decision| RailwayAI
    CoreEngines -.->|Escalation & Approval Alerts| RailwayNotify
    CoreEngines -.->|Caching & Idempotency| RailwayRedis
    CoreEngines -->|Durable Persistence| Database
```

---

## 3. Key Product Features

### 3.1 Workflows & Data Sources Inventory
- **Data Sources**: Registered with unique IDs, names, descriptions, explicit owner emails, sensitivity classifications (`PUBLIC`, `INTERNAL`, `CONFIDENTIAL`, `RESTRICTED_PII`, `RESTRICTED_FINANCIAL`, `RESTRICTED_HEALTH`), data residency regions, retention day limits, and PII containment flags.
- **AI Workflows**: Registered with unique IDs, names, business units, owners, risk tiers (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), model families (e.g. `GPT-4o`, `Claude 3.5 Sonnet`, `Custom Llama 3`), and operational active flags.

### 3.2 Visual Policy Registry & Rule Builder
- Scopes rules by action: `READ`, `TRAIN`, `EMBED`, `FINE_TUNE`, `INFER`, `EXPORT`, `CACHE`, or `*`.
- Scopes rules by purpose: `CUSTOMER_SUPPORT`, `ANALYTICS`, `MODEL_TRAINING`, `RAG_RETRIEVAL`, `FRAUD_DETECTION`, `OPERATIONAL_DEBUGGING`, or `*`.
- Scopes rules by resource: explicit IDs, prefix wildcards (e.g. `customer-*`), or `*`.
- Mandatory condition requirements: `user_consent_verified`, `pii_tokenized`, `mfa_verified`, `tenant_boundary_enforced`, `retention_days_limit`.

### 3.3 Interactive Decision Simulator
- Evaluates synthetic requests (`isSimulation: true`) without requiring cloud infrastructure mutations.
- Instantly visualizes the deterministic decision, matched policy and rule ID, evaluated condition pass/fail checks, unmet requirements, and governance summaries.
- Pre-loaded with one-click synthetic enterprise scenarios.

### 3.4 Multi-Version Policy Governance & Approval Queue
- Policies undergo versioning (v1, v2...).
- Modifying a policy creates a `DRAFT` version, preventing unreviewed changes to active enforcement rules.
- Submitting for approval transitions the policy to `PENDING_APPROVAL` and dispatches an alert via the Railway Notification Service.
- Authorized Security Operators can `APPROVE` (which promotes the draft to `ACTIVE` and safely archives previous active versions) or `REJECT` with reviewer comments.

---

## 4. Deterministic Policy Evaluation Engine

The authorization engine follows strict deterministic precedence:

```
[Incoming Access Request]
          │
          ▼
1. Are Workflow & Data Source Cataloged and Active?
   ├─► NO  ──► [DENY] (Safe Default-Deny for uncataloged/inactive assets)
   └─► YES
          │
          ▼
2. Does any matching rule have effect: 'DENY'?
   ├─► YES ──► [DENY] (Explicit DENY overrides all permissive rules)
   └─► NO
          │
          ▼
3. Is action High-Risk (e.g. TRAIN, EXPORT) on Restricted Data (PII, Financial, Health)?
   ├─► YES ──► [ESCALATE] (Mandatory SecOps human signoff)
   └─► NO
          │
          ▼
4. Does any matching rule have effect: 'ESCALATE'?
   ├─► YES ──► [ESCALATE] (High-risk or sensitive operation escalated)
   └─► NO
          │
          ▼
5. Does a matching rule have effect: 'ALLOW'?
   ├─► YES ──► Are ALL mandatory conditions satisfied?
   │            ├─► YES ──► [ALLOW] (Access granted)
   │            └─► NO  ──► [DENY]  (Mandatory conditions unmet)
   └─► NO  ──► [DENY] (Safe Default-Deny: No rule permits this request)
```

> **Security Rule**: An AI model is NEVER permitted to decide or override access. The Railway AI Platform is used solely to generate optional plain-language explanations of the deterministic outcome.

---

## 5. Cryptographic Tamper-Evident Audit Trail

Every evaluation (both synthetic simulations and real authorization checks) produces an append-only audit record linked into a cryptographic hash chain:

$$\text{recordHash} = \text{SHA-256}(\text{previousRecordHash} : \text{id} : \text{seq} : \text{timestamp} : \text{decision} : \text{isSimulation} : \text{matchedPolicyId} : \text{requestHash})$$

- **Genesis Record**: The first record binds to a 64-character zero genesis hash (`0000000000000000...`).
- **Integrity Verification**: The `/audit/verify-integrity` API endpoint and the interactive console modal recompute the SHA-256 chain from the genesis block through the latest record, detecting any inserted, deleted, or modified records.
- **Privacy Redaction**: All contexts and request payloads are sanitized before logging (`SanitizerUtil.redactSensitiveData`), masking credentials, bearer tokens, API keys, and sensitive attributes.

---

## 6. Public Access & Security Governance (`PUBLIC_ACCESS_ENABLE`)

The backend enforces the `PUBLIC_ACCESS_ENABLE` feature flag using `CombinedAuthGuard`:

| Endpoint Category | Route Examples | `PUBLIC_ACCESS_ENABLE=false` | `PUBLIC_ACCESS_ENABLE=true` |
|---|---|---|---|
| **Health Probes** | `GET /health` | Public | Public |
| **Authentication** | `POST /auth/login`, `GET /auth/status` | Public | Public |
| **Inventory Catalog** | `GET /inventory/workflows`, `GET /inventory/data-sources` | Requires Auth | Public Read-Only |
| **Active Policies** | `GET /policies`, `GET /policies/active` | Requires Auth | Public Read-Only |
| **Synthetic Simulator** | `POST /access-request/simulate`, `POST /access-request/evaluate` (`isSimulation: true`) | Requires Auth | Public Demo Allowed |
| **Real Access Checks** | `POST /access-request/evaluate` (`isSimulation: false`) | Requires Auth | **Requires Auth (Blocked for Public)** |
| **Policy Mutations** | `POST /policies`, `POST /policies/:id/version`, `PUT /policies/:id` | Requires Auth | **Requires Auth (Blocked for Public)** |
| **Governance Approvals** | `GET /approvals`, `POST /approvals/:id/review` | Requires Auth | **Requires Auth (Blocked for Public)** |
| **Private Audit Trail** | `GET /audit/records`, `GET /audit/verify-integrity` | Requires Auth | **Requires Auth (Blocked for Public)** |

> **Crucial Rule**: The public access flag is verified and enforced on the server. Public visitors cannot bypass authorization guards, view private audit logs, or mutate policies.

---

## 7. Integrations: Real Contracts vs. Fallbacks

### 7.1 Shared Railway AI Platform
- **Verified Contract**: `POST /api/v1/ai/chat` on `AI_PLATFORM_URL`
- **Headers**: `x-api-key: <AI_PLATFORM_API_KEY>`, `Content-Type: application/json`
- **Payload**:
  ```json
  {
    "applicationId": "ai-data-access-policy-auditor",
    "tenantId": "security-governance",
    "message": "Analyze decision ALLOW for support-chat-assistant...",
    "systemInstruction": "You are a Senior Application Security & Authorization Governance Specialist..."
  }
  ```
- **Fallback**: If `AI_PLATFORM_URL` is omitted, unreachable, or returns an error, the backend seamlessly generates a structured deterministic explanation. AI explanations never alter the authorization decision.

### 7.2 Shared Railway Notification Service
- **Verified Contract**: `POST /v1/notifications` on `NOTIFICATION_SERVICE_URL`
- **Headers**: `x-api-key: <NOTIFICATION_SERVICE_API_KEY>`, `Content-Type: application/json`
- **Payload**:
  ```json
  {
    "priority": "CRITICAL",
    "channels": ["EMAIL"],
    "recipient": {
      "userId": "secops-oncall",
      "email": "secops-alerts@company.internal"
    },
    "email": {
      "subject": "[CRITICAL] AI Data Access ESCALATION: ...",
      "html": "<h2>Security Escalation</h2>..."
    },
    "metadata": {
      "source": "ai-data-access-policy-auditor",
      "category": "ACCESS_ESCALATION"
    }
  }
  ```
- **Fallback**: If unconfigured or offline, notifications are logged safely to the structured audit log.

### 7.3 Shared Railway Redis
- **Configuration**: `REDIS_URL`
- **Usage**: Evaluated simulation result caching, rate limiting, and idempotency key checking.
- **Fallback**: Seamlessly falls back to an in-memory TTL Map.

---

## 8. Persistence Strategy

- **Durable MongoDB**: When `MONGODB_URI` is provided, entities (Workflows, DataSources, Policies, Approvals, and AuditRecords) are durably stored in MongoDB via Mongoose.
- **Atomic In-Memory Fallback**: When `MONGODB_URI` is omitted or disconnected, the application operates via `InMemoryStorageService`, providing thread-safe, atomic operations for local development, CI/CD pipelines, and automated test runs.
- **Guarantee**: Audit records are maintained in an immutable sequence with cryptographic hashes and **never depend on ephemeral local files**.

---

## 9. Environment Variables Reference

See `.env.example` in the repository root for the full template:

```bash
# Backend Server
NODE_ENV=development
PORT=4000
API_PREFIX=api/v1
CORS_ORIGIN=*

# Access Control
PUBLIC_ACCESS_ENABLE=false
JWT_SECRET=super-secret-jwt-key-minimum-32-chars-long-secops
OPERATOR_ADMIN_PASSWORD=admin123!
SERVICE_API_KEY=secops-internal-service-key-production

# Persistence
MONGODB_URI=mongodb://root:rootpassword@localhost:27017/policy_auditor?authSource=admin
REDIS_URL=redis://localhost:6379

# Integrations
AI_PLATFORM_URL=https://ai-platform.onrender.com
AI_PLATFORM_API_KEY=replace-with-ai-platform-service-key
NOTIFICATION_SERVICE_URL=https://notification-service.onrender.com
NOTIFICATION_SERVICE_API_KEY=replace-with-notification-service-key
ALERT_EMAIL_RECIPIENT=secops-oncall@company.internal

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_APP_NAME="AI Data Access & Policy Auditor"
NEXT_PUBLIC_DEFAULT_PUBLIC_ACCESS=false
```

---

## 10. Deployment Guide

### Render (Backend Web Service)
Configured via `render.yaml`:
1. **Service Type**: Web Service
2. **Environment**: Node
3. **Root Directory**: `backend`
4. **Build Command**: `npm install && npm run build`
5. **Start Command**: `npm run start:prod` (executes `node dist/main`)
6. **Health Check Path**: `/health`
7. **Port**: Automatically binds to `0.0.0.0` and `process.env.PORT`.

### Vercel (Frontend Console)
1. **Framework Preset**: Next.js
2. **Root Directory**: `frontend`
3. **Build Command**: `next build`
4. **Output Directory**: `.next`
5. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: URL of the deployed Render backend (e.g. `https://ai-data-access-policy-auditor-backend.onrender.com/api/v1`)
   - `NEXT_PUBLIC_APP_NAME`: `AI Data Access & Policy Auditor`

---

## 11. Local Development & Testing

### Installation
```bash
# Install root, backend, and frontend packages
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### Running Locally
```bash
# Start backend in development mode (port 4000)
npm run start:backend

# Start frontend in development mode (port 3000)
npm run start:frontend
```

### Running Tests
```bash
# Run all tests across backend and frontend
npm test

# Run backend tests only
npm run test:backend

# Run frontend tests only
npm run test:frontend
```

### Running Linters
```bash
# Run linting across both projects
npm run lint
```

### Production Build Verification
```bash
# Compile both backend and frontend production builds
npm run build
```

---

## 12. Walkthrough Scenarios & Smoke Test Checklist

### Pre-loaded Enterprise Scenarios

1. **Scenario 1: Permitted Customer Support Knowledge Retrieval (ALLOW)**
   - **Workflow**: `support-chat-assistant`
   - **Data Source**: `customer-support-transcripts`
   - **Action / Purpose**: `READ` / `CUSTOMER_SUPPORT`
   - **Context**: `pii_tokenized: true`, `user_consent_verified: true`
   - **Outcome**: **ALLOW** (Rule `RULE-001-ALLOW-SUPPORT-READ` satisfied).

2. **Scenario 2: Prohibited Model Training on PII Transcripts (DENY)**
   - **Workflow**: `code-generation-copilot`
   - **Data Source**: `customer-support-transcripts`
   - **Action / Purpose**: `TRAIN` / `MODEL_TRAINING`
   - **Outcome**: **DENY** (Explicit DENY rule `RULE-002-DENY-TRAINING-ON-PII` overrides all allow rules).

3. **Scenario 3: High-Risk Ledger Access Escalation (ESCALATE)**
   - **Workflow**: `financial-fraud-detector`
   - **Data Source**: `financial-transactions-ledger`
   - **Action / Purpose**: `READ` / `FRAUD_DETECTION`
   - **Outcome**: **ESCALATE** (High-sensitivity financial data requires dual-custody SecOps signoff).

4. **Scenario 4: Missing Required Conditions (DENY)**
   - **Workflow**: `support-chat-assistant`
   - **Data Source**: `customer-support-transcripts`
   - **Action / Purpose**: `READ` / `CUSTOMER_SUPPORT`
   - **Context**: `user_consent_verified: false`
   - **Outcome**: **DENY** (Missing mandatory consent requirement).

5. **Scenario 5: Unregistered Target Resource Default-Deny (DENY)**
   - **Workflow**: `support-chat-assistant`
   - **Data Source**: `unregistered-shadow-database-v2`
   - **Outcome**: **DENY** (Safe Default-Deny rule protects untracked assets).

### Smoke Test Checklist
- [x] Backend compiles cleanly with local `@nestjs/cli` dependency (`npm run build:backend`).
- [x] Backend starts and binds to `0.0.0.0:$PORT`.
- [x] Public `/health` probe returns HTTP 200 with subsystem statuses.
- [x] Frontend compiles with zero ESLint warnings and static-prerenders 11 pages (`npm run build:frontend`).
- [x] Deterministic evaluator enforces explicit DENY over ALLOW precedence.
- [x] High-risk actions on restricted data deterministically output `ESCALATE`.
- [x] Missing mandatory conditions result in `DENY` with actionable requirement lists.
- [x] SHA-256 cryptographic chain correctly links records from genesis to latest.
- [x] Tampered record injection is immediately flagged by the integrity verifier.
- [x] `PUBLIC_ACCESS_ENABLE=false` rejects unauthenticated requests on protected routes.
- [x] `PUBLIC_ACCESS_ENABLE=true` allows synthetic simulator access while strictly blocking private audit logs and policy modifications.
- [x] Mobile layouts remain fully functional across widths from 320px to 1440px.

---

## 13. Troubleshooting & FAQ

**Q: Why was my access request evaluated as DENY when an ALLOW rule exists?**  
*A*: Check the mandatory conditions list. If any condition (e.g. `pii_tokenized`, `user_consent_verified`) evaluates to false, the request is denied. Furthermore, if any matching rule specifies `effect: DENY`, explicit DENY takes precedence over all ALLOW rules.

**Q: Does evaluating an access request here modify database permissions?**  
*A*: No. This auditor evaluates authorization policies and records verifiable compliance evidence. It does not grant cloud credentials or modify database ACLs unless a dedicated enforcement agent is explicitly integrated.

**Q: What happens if the Railway AI Platform is unreachable?**  
*A*: The system automatically engages its built-in deterministic governance summary engine. The core authorization decision is NEVER dependent on external AI models.

**Q: How do I test the public mode vs operator mode?**  
*A*: Toggle `PUBLIC_ACCESS_ENABLE=true` in `.env` to explore in Public Viewer Mode. Sign in with `admin@secops.internal` and `admin123!` to unlock operator capabilities.
