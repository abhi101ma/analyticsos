# Metric Ops

Metric Ops is an open-source Analytics/AI/Data OS control panel for analytics engineering, data engineering, and AI teams.

## Why event log + audit trail
All significant actions emit append-only events (`os_events`) while current state is read from `os_work_items` snapshots. This preserves complete auditability and supports future AI agents writing the same event types.

## Stack
- Backend: Node.js, TypeScript, Fastify, ClickHouse, Zod, JWT, pino
- Frontend: React + Vite + Tailwind + React Query + React Hook Form
- DB: ClickHouse (`ReplacingMergeTree` + append-heavy design)

## Run locally
```bash
docker compose up --build
```
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- API docs: http://localhost:3000/api/docs

Seed after services are up:
```bash
docker compose exec backend npm run seed
```

Default admin: `admin@local` / `admin123`

## Schema overview
`db/schema.sql` defines:
- `os_users`
- `os_work_items` (current snapshot)
- `os_work_deps`
- `os_comments`
- `os_approvals`
- `os_artifacts`
- `os_events`
- `os_kpi_snapshots`

## Stage gates
Rules are in `backend/src/domain/stageRules.ts`:
- `metric_factory` -> `Spec Approved` requires `spec_approval`
- `metric_factory` -> `Certified Published` requires `reconcile_approval`
- `done` status only allowed in final board stage

## Add a new board or stage
1. Edit `BOARD_STAGES` in `backend/src/domain/stageRules.ts`
2. Optionally add `GATE_REQUIREMENTS`
3. Frontend board tabs use board keys in URL and render stages from returned data automatically.

## Security notes
- JWT auth for API
- Passwords hashed with bcrypt
- v1 is local/dev friendly; add RBAC hardening + secret rotation for production

## Roadmap
- AI agents can safely join by calling the same APIs and writing equivalent events
- Real-time updates (SSE/WebSockets)
- Advanced SLA policy engine
