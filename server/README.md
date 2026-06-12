# Background Job Scheduler — Backend

Express + TypeScript backend for the background job scheduler.

## Stack
- **Runtime:** Node.js 20+
- **Framework:** Express 5
- **Database:** SQLite (better-sqlite3)
- **Cache / Locks:** Redis (ioredis)
- **Language:** TypeScript

## Setup

### 1. Install dependencies
```bash
pnpm install
```

### 2. Set up environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=4000
NODE_ENV=development
ALLOWED_ORIGIN=http://localhost:3000
SQLITE_PATH=./data/scheduler.db
REDIS_URL=redis://localhost:6379
WORKER_POLL_INTERVAL_MS=1000
STARVATION_CHECK_INTERVAL_MS=120000
STARVATION_THRESHOLD_MS=300000
DLQ_ALERT_THRESHOLD=10
DLQ_ALERT_WEBHOOK_URL=https://webhook.site/your-unique-id
```

### 3. Run dev server
```bash
pnpm dev
```

Server starts at `http://localhost:4000`
Swagger UI at `http://localhost:4000/api-docs`

### 4. Run benchmark
```bash
pnpm benchmark
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Server info |
| GET | `/api/v1/health` | Health check |
| GET | `/api/jobs` | List all jobs |
| POST | `/api/jobs` | Create a job |
| GET | `/api/jobs/stats` | Job counts by status |
| GET | `/api/jobs/:id` | Get job by ID |
| PATCH | `/api/jobs/:id/cancel` | Cancel a job |
| GET | `/api/dlq` | List DLQ entries |
| POST | `/api/dlq/:id/retry` | Retry a DLQ job |
| GET | `/api/events` | SSE live updates |
| GET | `/api-docs` | Swagger UI |

---

## Testing with cURL / Postman

### Create a basic webhook job
```json
POST /api/jobs
{
  "type": "webhook",
  "priority": 1,
  "payload": {
    "url": "https://webhook.site/your-unique-id",
    "method": "POST",
    "body": {
      "event": "user.signup",
      "userId": "abc123"
    }
  }
}
```

### Create a scheduled job (runs in 1 minute)
```json
POST /api/jobs
{
  "type": "webhook",
  "priority": 2,
  "scheduled_at": "2026-06-10T14:00:00Z",
  "payload": {
    "url": "https://webhook.site/your-unique-id",
    "body": { "event": "scheduled.ping" }
  }
}
```

### Create a recurring job (every 1 minute)
```json
POST /api/jobs
{
  "type": "webhook",
  "priority": 2,
  "recurrence_interval": "every_1_minute",
  "payload": {
    "url": "https://webhook.site/your-unique-id",
    "body": { "event": "recurring.ping" }
  }
}
```

### Create a job that will fail (triggers retries → DLQ)
```json
POST /api/jobs
{
  "type": "webhook",
  "priority": 1,
  "payload": {
    "url": "https://httpstat.us/500",
    "body": { "event": "will.fail" }
  }
}
```

### Create a job that times out
```json
POST /api/jobs
{
  "type": "webhook",
  "priority": 1,
  "payload": {
    "url": "https://httpstat.us/200?sleep=15000",
    "timeout_ms": 5000,
    "body": { "event": "will.timeout" }
  }
}
```

### Create a DAG workflow (3 jobs in sequence)
```json
// Step 1 — create the first job, note its ID
POST /api/jobs
{
  "type": "webhook",
  "priority": 1,
  "payload": {
    "url": "https://webhook.site/your-unique-id",
    "body": { "event": "step.1.generate_report" }
  }
}

// Step 2 — depends on step 1
POST /api/jobs
{
  "type": "webhook",
  "priority": 1,
  "dependency_ids": ["<step-1-job-id>"],
  "payload": {
    "url": "https://webhook.site/your-unique-id",
    "body": { "event": "step.2.upload_file" }
  }
}

// Step 3 — depends on step 2
POST /api/jobs
{
  "type": "webhook",
  "priority": 1,
  "dependency_ids": ["<step-2-job-id>"],
  "payload": {
    "url": "https://webhook.site/your-unique-id",
    "body": { "event": "step.3.send_email" }
  }
}
```

### Cancel a job
```bash
PATCH /api/jobs/:id/cancel
```

### View DLQ
```bash
GET /api/dlq
```

### Retry a DLQ job
```bash
POST /api/dlq/:dlq-entry-id/retry
```

### Get job stats (for dashboard)
```bash
GET /api/jobs/stats
```

### Subscribe to live updates (SSE)
```bash
GET /api/events

# In browser console:
const es = new EventSource('http://localhost:4000/api/events')
es.addEventListener('job.created', e => console.log(JSON.parse(e.data)))
es.addEventListener('job.completed', e => console.log(JSON.parse(e.data)))
es.addEventListener('job.failed', e => console.log(JSON.parse(e.data)))
```

---

## Testing Failure Scenarios

### Trigger DLQ alert webhook
Create 10+ jobs all pointing at `https://httpstat.us/500`.
They will each fail 3 times, land in the DLQ, and when the 10th one arrives
the alert webhook fires to your `DLQ_ALERT_WEBHOOK_URL`.

### Test starvation prevention
Create several low priority (3) jobs.
Set `STARVATION_THRESHOLD_MS=10000` (10s) and `STARVATION_CHECK_INTERVAL_MS=5000` (5s) in `.env`.
Watch logs — low priority jobs get promoted after 10s of waiting.

### Test duplicate protection
The Redis lock prevents two workers picking the same job.
With a single worker you can verify by checking logs —
each job ID appears in `Processing job X` exactly once.

## About this Scaffold

This project was generated using the @ifecodes/backend-template scaffold. You can recreate or customize this scaffold using the CLI:

- Run without installing (recommended): `npx ifecodes-template`
- Install globally: `npm i -g @ifecodes/backend-template` and run `ifecodes-template`

## License

MIT
