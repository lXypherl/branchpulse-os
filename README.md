# Xyloquent Branch OS

Franchise & multi-branch operations platform. A centralized HQ control layer for audits, standards enforcement, issue escalation, promo execution checks, stock requests, and cross-branch visibility.

## Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Docker & Docker Compose

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose

### Development

```bash
# Install dependencies
npm install

# Start PostgreSQL
docker compose up db -d

# Push schema to DB
npx prisma db push

# Seed demo data
npm run db:seed

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Docker Deployment

```bash
# Build and start all services
docker compose up --build -d

# Seed the database (run once)
docker compose --profile seed run --rm seed
```

## Modules

| Module | Description |
|--------|-------------|
| Dashboard | HQ command center with KPIs, regional performance, escalations |
| Branch Registry | Branch master data, hierarchy, compliance scores |
| Audit Management | Templates, submissions, scoring, evidence, review workflows |
| Issue Tracking | Non-compliance tracking, corrective actions, evidence |
| Escalation Engine | SLA timers, routing logic, aging triggers |
| Promo Checks | Campaign rollout validation across branches |
| Stock Requests | Branch supply requests, approvals, fulfillment |
| SOP Library | Governed standards with AI-powered Q&A |

## API Endpoints

- `GET/POST /api/branches` - Branch management
- `GET/POST /api/audits` - Audit management
- `GET/POST /api/issues` - Issue tracking
- `GET/POST /api/escalations` - Escalation management
- `GET /api/dashboard` - Dashboard stats
- `GET/POST /api/stock-requests` - Stock request management
- `GET/POST /api/promo-checks` - Promo check management
