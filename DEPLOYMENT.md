# ResQLink Backend — Deployment Guide

---

## Option 1: Run Locally (No Docker)

### Prerequisites
- Node.js 18+
- PostgreSQL 16+ installed natively

### Database Configuration
| Setting | Value |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Username | `resqlink` |
| Password | `resqlink` |
| Database | `resqlink_db` |

### Step 1 — Create Database
Open pgAdmin or psql and run:
```sql
CREATE USER resqlink WITH PASSWORD 'resqlink';
CREATE DATABASE resqlink_db OWNER resqlink;
GRANT ALL PRIVILEGES ON DATABASE resqlink_db TO resqlink;
```

### Step 2 — Create `.env` file
Create a `.env` file in the project root:
```env
DATABASE_URL="postgresql://resqlink:resqlink@localhost:5432/resqlink_db?schema=public"
JWT_ACCESS_SECRET="super-secret-access-key-resqlink-2026"
JWT_REFRESH_SECRET="super-secret-refresh-key-resqlink-2026"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="30d"
PORT=3001
```

### Step 3 — Install & Run
```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run start:dev
```

### Access Points
| | URL |
|---|---|
| Swagger API Docs | http://localhost:3001/api/docs |
| Admin Dashboard | http://localhost:3001/admin |

---

## Option 2: Run Locally (With Docker)

### Prerequisites
- Node.js 18+
- Docker Desktop

### Step 1 — Start Database Containers
```bash
docker-compose up -d
```
This starts PostgreSQL on port `5433` and Redis on port `6379`.

### Step 2 — Create `.env` file
```env
DATABASE_URL="postgresql://resqlink:resqlink@localhost:5433/resqlink_db?schema=public"
JWT_ACCESS_SECRET="super-secret-access-key-resqlink-2026"
JWT_REFRESH_SECRET="super-secret-refresh-key-resqlink-2026"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="30d"
PORT=3001
```

### Step 3 — Install & Run
```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run start:dev
```

---

## Option 3: Deploy to Railway (Free — Recommended)

Railway gives $5 free credit/month — enough for a small project. Supports WebSockets, PostgreSQL, and NestJS out of the box.

### Step 1 — Push code to GitHub
Make sure your project is pushed to a GitHub repository.

### Step 2 — Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub

### Step 3 — Create New Project
1. Click **New Project**
2. Select **Deploy from GitHub repo**
3. Select your repository
4. Click **Deploy Now**

### Step 4 — Add PostgreSQL Database
1. In your Railway project, click **New**
2. Select **Database** → **PostgreSQL**
3. Railway automatically sets the `DATABASE_URL` variable

### Step 5 — Set Environment Variables
Go to your service → **Variables** tab → add these:
```
JWT_ACCESS_SECRET=super-secret-access-key-resqlink-2026
JWT_REFRESH_SECRET=super-secret-refresh-key-resqlink-2026
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
PORT=3001
```
> `DATABASE_URL` is set automatically by Railway when you add PostgreSQL.

### Step 6 — Set Start Command
Go to your service → **Settings** → **Deploy** → set:
```
npm run start:prod
```

### Step 7 — Run Migrations
In Railway, open the service shell or add a deploy command:
```bash
npx prisma migrate deploy
```

### Step 8 — Access Your App
Railway gives you a public URL like:
```
https://resqlink-backend-production.up.railway.app
```

| | URL |
|---|---|
| Swagger API Docs | `https://your-app.up.railway.app/api/docs` |
| Admin Dashboard | `https://your-app.up.railway.app/admin` |

---

## Option 4: Deploy to Render (Free)

> Note: Free tier sleeps after 15 minutes of inactivity.

### Step 1 — Create Render Account
Go to [render.com](https://render.com) and sign up with GitHub.

### Step 2 — Create PostgreSQL Database
1. Click **New** → **PostgreSQL**
2. Name it `resqlink-db`
3. Select **Free** tier
4. Click **Create Database**
5. Copy the **External Database URL**

### Step 3 — Create Web Service
1. Click **New** → **Web Service**
2. Connect your GitHub repo
3. Set these:

| Setting | Value |
|---|---|
| Runtime | Node |
| Build Command | `npm install && npx prisma generate && npx prisma migrate deploy` |
| Start Command | `npm run start:prod` |

### Step 4 — Set Environment Variables
```
DATABASE_URL=<paste External Database URL from Step 2>
JWT_ACCESS_SECRET=super-secret-access-key-resqlink-2026
JWT_REFRESH_SECRET=super-secret-refresh-key-resqlink-2026
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
PORT=3001
```

### Step 5 — Deploy
Click **Create Web Service** — Render will build and deploy automatically.

---

## Test Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | admin@resqlink.com | Admin@1234 |
| Patient | patient@resqlink.com | Patient@1234 |
| Driver | driver@resqlink.com | Driver@1234 |
| Paramedic | paramedic@resqlink.com | Paramedic@1234 |

---

## Common Issues

### `Property 'hospital' does not exist on PrismaService`
The hospitals module was removed. Delete the leftover folder:
```bash
# Windows
Remove-Item -Recurse -Force src\modules\hospitals

# Mac/Linux
rm -rf src/modules/hospitals
```
Then run `npx prisma generate`.

### `Property 'otpCode' does not exist on PrismaService`
Prisma client needs to be regenerated:
```bash
npx prisma generate
```

### `database "resqlink_db" does not exist`
Create the database first — see Step 1 of Option 1.

### `password authentication failed for user "postgres"`
Make sure you're connecting on the correct port (`5432` for native, `5433` for Docker).
