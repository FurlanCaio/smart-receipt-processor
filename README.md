# Smart Receipt Processor

A full-stack SaaS application that automates receipt processing using AI. Users upload receipts, which are analyzed by OpenAI's vision models, reviewed by a human operator (HITL), and organized into expense reports.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Key Technical Decisions](#key-technical-decisions)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Technical Debt & Roadmap](#technical-debt--roadmap)

---

## Overview

Manual receipt management is slow and error-prone. Smart Receipt Processor solves this by combining direct S3 uploads, asynchronous AI processing via job queues, and a human-in-the-loop approval flow — ensuring data accuracy before any irreversible action is taken.

The system is designed for teams and individuals who need to process, approve, and organize receipts into structured expense reports.

---

## Features

- **Direct S3 Upload** — files are uploaded directly from the browser to AWS S3 via presigned URLs, without passing through the backend
- **AI-Powered Extraction** — OpenAI vision models extract seller name, date, total amount, tax, currency, and itemized data from receipt images
- **Asynchronous Processing** — receipt jobs are queued via BullMQ and processed by a dedicated worker, keeping the API responsive
- **Human-in-the-Loop (HITL)** — extracted data requires human review and approval before being finalized
- **Expense Reports** — approved receipts can be grouped into exportable expense reports (XLSX)
- **Secure Authentication** — JWT access tokens (1h expiry) + HTTP-only cookie refresh tokens (7d) with HMAC-SHA256 hashing
- **Real Pagination** — server-side pagination, sorting, filtering, and search across receipts
- **Soft Delete** — receipts and accounts are soft-deleted, preserving data integrity
- **Rate Limiting** — upload endpoints are rate-limited per IP to prevent abuse
- **Demo Limit** — demo accounts are limited to 3 receipts to control costs

---

## Architecture

```
Browser
  │
  ├── GET /receipts/presigned-url ──► API ──► AWS S3 (presigned URL)
  │
  ├── PUT (presigned URL) ──────────────────► AWS S3 (direct upload)
  │
  ├── POST /receipts (s3Key) ──────► API ──► MongoDB (create receipt)
  │                                    │
  │                                    └──► BullMQ (enqueue job)
  │                                              │
  │                                         Worker ──► AWS S3 (get image URL)
  │                                              │
  │                                         Worker ──► OpenAI (analyze image)
  │                                              │
  │                                         Worker ──► MongoDB (update receipt: needs_approval)
  │
  └── PATCH /receipts/:id/approve ──► API ──► MongoDB (status: approved)
```

**Why this flow?**

Uploading directly to S3 eliminates file streaming through the backend, reducing server load and latency. The BullMQ queue decouples the upload from the AI processing, so users can upload multiple receipts without waiting. The HITL step ensures that AI errors don't propagate into finalized financial data.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Node.js, Express, TypeScript |
| Worker | Node.js, BullMQ, TypeScript |
| Frontend | Vue 3, Vite, Pinia, Tailwind CSS (JavaScript) |
| Database | MongoDB, Mongoose |
| Queue | BullMQ, Redis |
| Storage | AWS S3 |
| AI | OpenAI (GPT-4o-mini by default) |
| Auth | JWT, bcrypt, HMAC-SHA256 |
| Encryption | AES-256-CBC (API key storage) |
| Monorepo | npm workspaces, shared `tsc` build via `tsconfig.build.json` |

---

## Project Structure

```
smart-receipt-processor/
├── apps/
│   └── api/                    # Express REST API (TypeScript)
│       └── src/
│           ├── errors/         # Custom error class hierarchy
│           ├── middlewares/    # Auth, error handler, rate limit
│           ├── types/          # Ambient/express type augmentations
│           └── modules/
│               ├── auth/       # Register, login, refresh, logout
│               ├── receipts/   # Upload, process, approve, reject
│               ├── expenseReports/  # Report management + XLSX export
│               └── users/      # Profile, avatar, preferences, password
├── packages/
│   └── database/               # Mongoose models + DB connection (shared, TypeScript)
├── queue/                      # BullMQ queue definition + Redis connection (TypeScript)
├── shared/                     # AWS S3 client (shared, TypeScript)
├── web/                        # Vue 3 frontend (JavaScript)
├── worker/                     # BullMQ worker + OpenAI integration (TypeScript)
├── tsconfig.build.json          # Root TS project: compiles api, worker, queue, shared, database into /dist
└── dist/                        # Compiled output (git-ignored), consumed by npm start / start:worker
```

---

## Key Technical Decisions

### Direct S3 Upload via Presigned URLs

The frontend requests a presigned URL from the API, uploads the file directly to S3, and sends only the resulting `s3Key` to the backend. This avoids streaming binary data through the server, reducing memory usage and improving throughput.

### Short Payload in the Queue

Only `receiptID` and `userID` are enqueued — not the file itself. The worker fetches what it needs from the database and S3. This keeps the queue lightweight and avoids Redis memory issues with large payloads.

### Human-in-the-Loop (HITL)

After AI extraction, the receipt enters `needs_approval` status. A human must review and approve before the status becomes `approved`. This prevents AI hallucinations from corrupting financial records — receipts cannot be added to expense reports without prior approval.

### Stateful JWT Authentication

Access tokens are short-lived (1 hour) and stored in memory. Refresh tokens are stored as HMAC-SHA256 hashes in MongoDB and set as HTTP-only, `SameSite: strict` cookies. This prevents XSS token theft and allows server-side token revocation on logout.

### OpenAI API Key Encryption

User API keys are encrypted with AES-256-CBC before storage. The encryption key and IV are never stored together. In demo mode, the system uses a fixed server-side key instead.

### Custom Error Class Hierarchy

```
AppError
├── ValidationError    (400)
├── AuthenticationError (401)
├── AuthorizationError  (403)
├── NotFoundError      (404)
├── ResourceGoneError  (410)
└── ConfigurationError (500)
```

All errors are handled by a centralized `errorHandler` middleware, keeping controllers clean.

### Resilient Job Processing

BullMQ jobs are configured with 3 retry attempts and exponential backoff (5s base delay). If a job fails, the receipt status is updated to `failed` with the error message. The worker handles graceful shutdown on `SIGTERM`/`SIGINT`.

---

## Getting Started

### Prerequisites

- Node.js >= 20
- MongoDB
- Redis
- AWS S3 bucket
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/caio-furlan/smart-receipt-processor.git
cd smart-receipt-processor

# Install all workspace dependencies
npm install
```

### Running the services

**Development** (uses `tsx watch`, no build step needed):

```bash
# Start the API (from repo root)
npm run dev:api

# Start the Worker (separate terminal, from repo root)
npm run dev:worker

# Start the Frontend (separate terminal)
cd web
npm run dev
```

**Production** (compiles TypeScript first via the root `tsc` project):

```bash
# Build all backend packages (api, worker, queue, shared, database) into /dist
npm run build

# Start the API
npm run start:api

# Start the Worker (separate process/service)
npm run start:worker
```

---

## Environment Variables

### API (`apps/api/src/.env`)

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/smart-receipt-processor
JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
API_KEY_ENCRYPTION_KEY=32_byte_hex_key
AWS_S3_BUCKET_NAME=your_bucket
AWS_REGION=us-east-1
AWS_ACCESS_KEY=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### Worker (`worker/.env`)

```env
MONGO_URI=mongodb://localhost:27017/smart-receipt-processor
OPENAI_API_KEY=your_openai_key
API_KEY_ENCRYPTION_KEY=32_byte_hex_key
AWS_S3_BUCKET_NAME=your_bucket
AWS_REGION=us-east-1
AWS_ACCESS_KEY=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### Queue & Shared

```env
# queue/.env and shared/.env
REDIS_HOST=localhost
REDIS_PORT=6379
AWS_S3_BUCKET_NAME=your_bucket
AWS_REGION=us-east-1
AWS_ACCESS_KEY=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

---

## API Reference

### Auth

| Method | Route | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and receive access + refresh token |
| POST | `/auth/refresh` | Refresh access token using cookie |
| POST | `/auth/logout` | Revoke refresh token |

### Receipts

| Method | Route | Description |
|---|---|---|
| GET | `/receipts` | List receipts (paginated, filterable) |
| GET | `/receipts/:id` | Get receipt by ID |
| GET | `/receipts/presigned-url` | Get S3 presigned upload URL |
| POST | `/receipts` | Create receipt after S3 upload |
| PATCH | `/receipts/:id` | Update extracted data |
| PATCH | `/receipts/:id/approve` | Approve receipt |
| PATCH | `/receipts/:id/reject` | Reject receipt |
| PATCH | `/receipts/:id/reopen` | Reopen rejected receipt |
| DELETE | `/receipts/:id` | Soft delete receipt |
| DELETE | `/receipts/bulk` | Soft delete multiple receipts |
| GET | `/receipts/:id/download` | Get signed download URL |

### Expense Reports

| Method | Route | Description |
|---|---|---|
| GET | `/expense-reports` | List reports |
| GET | `/expense-reports/:id` | Get report with receipts |
| POST | `/expense-reports` | Create report |
| PUT | `/expense-reports/:id` | Update report |
| DELETE | `/expense-reports/:id` | Soft delete report |
| POST | `/expense-reports/:id/receipts` | Add approved receipt to report |
| DELETE | `/expense-reports/:id/receipts/:receiptId` | Remove receipt from report |
| GET | `/expense-reports/:id/export/xlsx` | Export report as XLSX |

### Users

| Method | Route | Description |
|---|---|---|
| GET | `/users/profile` | Get user profile |
| PATCH | `/users/profile` | Update profile |
| PATCH | `/users/password` | Change password |
| DELETE | `/users/account` | Soft delete account |
| POST | `/users/avatar` | Upload avatar |
| DELETE | `/users/avatar` | Remove avatar |
| GET | `/users/preferences` | Get AI preferences |
| PATCH | `/users/preferences` | Update AI model and temperature |
| POST | `/users/api-key` | Save encrypted OpenAI API key |

---

## Technical Debt & Roadmap

### Known Technical Debt

**No test coverage**
The project has zero automated tests. Priority additions for v2:
- Unit tests for service layer (Jest)
- Integration tests for API routes (Supertest)
- Mock strategy for S3 and OpenAI calls

**`usersService` uses generic Error throws**
Unlike `receiptService` and `authService`, `usersService` throws generic `Error` instead of the custom error class hierarchy. The `usersController` compensates with string-matching fallbacks. This should be refactored to use `NotFoundError`, `ValidationError`, etc. consistently.

**No path aliases**
Relative imports like `../../../errors/AppError` are verbose and fragile. Adding TS path aliases via `tsconfig` (e.g. `@errors/AppError`) would improve readability and refactoring. Note this needs matching runtime resolution (e.g. `tsc-alias` or Node's subpath imports), since plain `tsc` doesn't rewrite path aliases in the compiled output.

**Frontend still in JavaScript**
The backend (api, worker, queue, shared, database) has been fully migrated to TypeScript, but `web/` remains plain JavaScript (`jsconfig.json`). Migrating the Vue frontend to TypeScript would extend type safety end-to-end, particularly around API response shapes shared with the backend.

**Single shared `tsc` build for all backend packages**
`npm run build` compiles `apps/api/src`, `worker`, `queue`, `shared`, and `packages/database` together via one root `tsconfig.build.json` into a single `dist/`. This is simple but means every deploy (API or worker) rebuilds code it doesn't need. Splitting into TypeScript project references, or per-package builds, would speed up CI/deploy build times as the codebase grows.

**S3 key naming**
Receipt files are stored under `uploads/{timestamp}-{filename}`. A more robust naming strategy (e.g. per-user prefixes: `receipts/{userId}/{uuid}`) would improve organization and enable per-user S3 policies.

### Roadmap (v2)

- [x] TypeScript migration (backend: api, worker, queue, shared, database)
- [ ] Full test coverage (Jest + Supertest)
- [ ] TypeScript migration for the frontend (`web/`)
- [ ] Path aliases across all packages
- [ ] Split backend build into per-package builds / TS project references
- [ ] Role-based access control (admin / user)
- [ ] Email notifications on receipt approval/rejection
- [ ] Webhook support for post-approval integrations
- [ ] Docker Compose setup for local development
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Per-user S3 prefixes

---

## Author

**Caio Francisco de Oliveira Furlan**
Full Stack Developer — Node.js · Vue.js · MongoDB · AWS

[LinkedIn](https://www.linkedin.com/in/caio-furlan-263978213) · [GitHub](https://github.com/caio-furlan)
