# ResQLink Backend

Real-time ambulance booking and dispatch system built with NestJS, Prisma, and PostgreSQL.

## Prerequisites

- **Node.js** >= 18
- **PostgreSQL** >= 14
- **npm** >= 9

## Getting Started

### 1. Clone the repository

```bash
git clone git@bitbucket.org:abdulshakoor1/resqlink-backend.git
cd resqlink-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup PostgreSQL

Make sure PostgreSQL is running on your machine.

**Create the database:**

```bash
psql -U postgres
```

```sql
CREATE DATABASE resqlink_db;
```

### 4. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/resqlink_db?schema=public"
JWT_ACCESS_SECRET="your_access_secret_here"
JWT_REFRESH_SECRET="your_refresh_secret_here"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="30d"
PORT=3001
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

### 5. Run database migrations

```bash
npx prisma migrate deploy
```

This will create all tables defined in `prisma/schema.prisma`.

### 6. Generate Prisma client

```bash
npx prisma generate
```

### 7. Seed the database (optional)

```bash
npm run seed
```

This creates test users, organizations, hospitals, ambulances, ride requests, and other sample data.

**Test login credentials after seeding:**

| Role      | Email                    | Password        |
|-----------|--------------------------|-----------------|
| Admin     | admin@resqlink.com       | Admin@1234      |
| Patient   | patient@resqlink.com     | Patient@1234    |
| Driver    | driver@resqlink.com      | Driver@1234     |
| Paramedic | paramedic@resqlink.com   | Paramedic@1234  |

### 8. Start the server

```bash
# Development (with hot-reload)
npm run start:dev

# Production build
npm run build
npm run start:prod
```

## Available URLs

| URL                              | Description            |
|----------------------------------|------------------------|
| `http://localhost:3001/api`      | API base               |
| `http://localhost:3001/api/docs` | Swagger documentation  |
| `http://localhost:3001/admin`    | Admin dashboard        |

## Project Structure

```
resqlink-backend/
├── admin/                  # Static admin dashboard (HTML/CSS/JS)
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.ts             # Database seeder
│   └── migrations/         # Migration files
├── src/
│   ├── common/             # Shared modules (Prisma, guards, decorators)
│   ├── config/             # Configuration module
│   └── modules/
│       ├── auth/           # Authentication (JWT, login, register)
│       ├── users/          # User management
│       ├── organizations/  # Organization CRUD
│       ├── hospitals/      # Hospital CRUD
│       ├── ambulances/     # Ambulance CRUD
│       ├── ride-requests/  # Ride request lifecycle
│       ├── dispatch/       # Ambulance dispatch logic
│       ├── tracking/       # Real-time GPS tracking (WebSocket)
│       ├── chats/          # In-ride chat (WebSocket)
│       ├── paramedic-profiles/ # Paramedic registration & verification
│       ├── driver-performance/ # Driver metrics & ratings
│       └── admin-actions/  # Admin audit log
├── .env                    # Environment variables
└── package.json
```

## API Modules

- **Auth** - Register, login, token refresh, password change
- **Users** - CRUD with role-based filtering
- **Organizations** - Organization management
- **Hospitals** - Hospital records with GPS coordinates
- **Ambulances** - Fleet management with status tracking
- **Ride Requests** - Full ride lifecycle (create, accept, pickup, complete, cancel)
- **Dispatch** - Auto-dispatch nearest ambulance, distance calculator
- **Tracking** - Real-time ambulance location via WebSocket
- **Chats** - In-ride messaging via WebSocket
- **Paramedic Profiles** - Registration with admin verification workflow
- **Driver Performance** - Ride stats, ratings, response times
- **Admin Actions** - Audit log for all admin operations

## User Roles

| Role      | Access Level                              |
|-----------|-------------------------------------------|
| ADMIN     | Full system access, dashboard, audit logs |
| USER      | Request rides, track ambulance, chat      |
| DRIVER    | Accept rides, update location, complete trips |
| PARAMEDIC | View assigned rides, update medical notes |

## Common Commands

```bash
# Run in development mode
npm run start:dev

# Build for production
npm run build

# Run migrations
npx prisma migrate deploy

# Create a new migration (after schema changes)
npx prisma migrate dev --name migration_name

# Seed database
npm run seed

# Open Prisma Studio (database GUI)
npx prisma studio

# Run linting
npm run lint

# Run tests
npm run test
```

## Troubleshooting

**PostgreSQL connection refused:**
Make sure PostgreSQL is running and the `DATABASE_URL` in `.env` is correct.

**Prisma migration errors:**
Run `npx prisma migrate reset` to reset and re-apply all migrations (this deletes all data).

**Port already in use:**
Kill the process using the port or change `PORT` in `.env`.

```bash
npx kill-port 3001
```
