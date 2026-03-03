# ResQLink Backend - Setup Guide

Step-by-step guide to set up and run the ResQLink backend on a new machine.

## Prerequisites

| Tool       | Minimum Version | Check Command      |
|------------|-----------------|---------------------|
| Node.js    | >= 18           | `node -v`           |
| npm        | >= 9            | `npm -v`            |
| Docker     | Any recent      | `docker --version`  |

## Step 1: Clone the Repository

```bash
git clone git@bitbucket.org:abdulshakoor1/resqlink-backend.git
cd resqlink-backend
```

## Step 2: Start PostgreSQL & Redis (Docker)

The project includes a `docker-compose.yml` that runs PostgreSQL 16 and Redis 7.

```bash
docker-compose up -d
```

Verify containers are running:

```bash
docker ps
```

You should see `resqlink_postgres` and `resqlink_redis` running.

**Port conflict note:** If you have a local PostgreSQL already running on port 5432 (e.g., from Laragon), either:
- Stop the local PostgreSQL first, or
- Change the port mapping in `docker-compose.yml` from `"5432:5432"` to `"5433:5432"` and update `DATABASE_URL` in `.env` accordingly

## Step 3: Create the `.env` File

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://resqlink:resqlink@localhost:5433/resqlink_db?schema=public"
JWT_ACCESS_SECRET="super-secret-access-key-resqlink-2026"
JWT_REFRESH_SECRET="super-secret-refresh-key-resqlink-2026"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="30d"
PORT=3001
```

> **Note:** The DB credentials (`resqlink`/`resqlink`) match the `docker-compose.yml` config. If you changed the Docker port to 5433, use port 5433 in the URL. If using default port, use 5432.

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Generate Prisma Client

```bash
npx prisma generate
```

## Step 6: Run Database Migrations

```bash
npx prisma migrate deploy
```

This creates all tables, enums, and indexes defined in the Prisma schema.

## Step 7: Seed the Database (Optional)

```bash
npm run seed
```

Creates test users, organizations, hospitals, ambulances, and sample data.

### Test Login Credentials (after seeding)

| Role      | Email                    | Password        |
|-----------|--------------------------|-----------------|
| Admin     | admin@resqlink.com       | Admin@1234      |
| Patient   | patient@resqlink.com     | Patient@1234    |
| Driver    | driver@resqlink.com      | Driver@1234     |
| Paramedic | paramedic@resqlink.com   | Paramedic@1234  |

## Step 8: Start the Development Server

```bash
npm run start:dev
```

The server starts with hot-reload on the configured PORT (default: 3001).

## Step 9: Verify Everything Works

| What              | URL                                |
|-------------------|------------------------------------|
| API Health Check  | http://localhost:3001/api           |
| Swagger API Docs  | http://localhost:3001/api/docs      |
| Admin Dashboard   | http://localhost:3001/admin         |

---

## Quick Reference Commands

### Development

```bash
npm run start:dev      # Dev server with hot-reload
npm run start:debug    # Dev server with debugger
npm run build          # Build for production
npm run start:prod     # Run production build
```

### Database

```bash
npx prisma studio                      # Visual database browser (opens at localhost:5555)
npx prisma migrate dev --name <name>    # Create a new migration after schema changes
npx prisma migrate reset               # Reset DB and re-apply all migrations (DELETES DATA)
npm run seed                            # Re-seed test data
```

### Docker Database Access

```bash
# Connect to PostgreSQL inside Docker
docker exec -it resqlink_postgres psql -U resqlink -d resqlink_db

# View Docker container logs
docker-compose logs postgres
docker-compose logs redis

# Stop all containers
docker-compose down
```

### Testing & Code Quality

```bash
npm run test           # Run unit tests
npm run test:watch     # Watch mode
npm run test:cov       # Coverage report
npm run test:e2e       # End-to-end tests
npm run lint           # ESLint with auto-fix
npm run format         # Prettier formatting
```

## Connecting with a Database GUI

Use any PostgreSQL client (pgAdmin, DBeaver, TablePlus, etc.) with:

| Setting  | Value         |
|----------|---------------|
| Host     | localhost     |
| Port     | 5433 (or 5432 if using default) |
| User     | resqlink      |
| Password | resqlink      |
| Database | resqlink_db   |

## WebSocket Endpoints

The app has two WebSocket namespaces (Socket.io):

- `/tracking` - Real-time ambulance GPS tracking
- `/chat` - In-ride messaging between patient and driver

## Troubleshooting

**Port 5432 already in use:**
Stop any local PostgreSQL (Laragon, standalone install) or remap Docker to port 5433 in `docker-compose.yml`.

**Authentication failed (Prisma):**
Ensure `.env` `DATABASE_URL` credentials match `docker-compose.yml` (`resqlink`/`resqlink`) and the port is correct.

**Prisma client not found:**
Run `npx prisma generate` after `npm install`.

**Docker containers not starting:**
Make sure Docker Desktop is running before executing `docker-compose up -d`.
