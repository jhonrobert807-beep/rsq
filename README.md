# 🚑 ResQLink Backend - Complete FYP Project

**A Real-Time Ambulance Booking & Dispatch System**

This is a **Final Year Project (FYP)** backend system designed for complete beginners to Node.js, NestJS, and backend development. Every step is explained in detail—no prior knowledge assumed!

---

## 📋 Table of Contents

1. [What is This Project?](#what-is-this-project)
2. [Features at a Glance](#features-at-a-glance)
3. [Technology Stack](#technology-stack)
4. [Prerequisites](#prerequisites)
5. [Complete Setup Guide](#complete-setup-guide)
6. [Running the Project](#running-the-project)
7. [Understanding the Code](#understanding-the-code)
8. [Project Structure](#project-structure)
9. [API Documentation](#api-documentation)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 What is This Project?

ResQLink is a **mobile/web application** that helps patients book ambulances in emergencies.

### How it works:

```
Patient Opens App
    ↓
Clicks "Book Ambulance"
    ↓
System Finds Nearest Available Ambulances
    ↓
Sends Notification to Drivers
    ↓
Driver Accepts the Ride
    ↓
Patient Sees Real-time Ambulance Location
    ↓
Driver Arrives & Takes Patient to Hospital
    ↓
Patient Pays & Rates the Service
```

This backend handles **all the logic** behind this process:

- User authentication (login/register)
- Finding nearest ambulances using GPS
- Managing ride bookings
- Processing payments
- Real-time location tracking
- Messaging between patient and driver
- Admin dashboard

---

## ✨ Features at a Glance

### For Patients

✅ Register & Login  
✅ Book ambulance with location  
✅ See ambulance arriving in real-time (GPS)  
✅ Chat with driver during ride  
✅ Rate service & pay for ride

### For Drivers/Paramedics

✅ Accept/reject ride requests  
✅ Update ambulance location (GPS tracking)  
✅ Message patient during ride  
✅ View performance analytics

### For Admins

✅ Manage users, ambulances, hospitals  
✅ View dashboard statistics  
✅ Audit logs of all admin actions  
✅ Reassign rides if needed

### For Organizations

✅ Register ambulance fleet  
✅ Track all ambulances  
✅ Manage drivers & paramedics

---

## 🛠️ Technology Stack

This project uses **modern backend technologies**:

| Technology     | What It Does        | Why We Use It                 |
| -------------- | ------------------- | ----------------------------- |
| **Node.js**    | JavaScript runtime  | Run JavaScript on server      |
| **NestJS**     | Web framework       | Build organized APIs          |
| **TypeScript** | JavaScript + Types  | Catch errors before running   |
| **PostgreSQL** | Database            | Store all data safely         |
| **Prisma**     | Database tool (ORM) | Query database with code      |
| **JWT**        | Authentication      | Secure login system           |
| **Socket.io**  | WebSockets          | Real-time updates (GPS, chat) |
| **Bcrypt**     | Encryption          | Hash passwords securely       |
| **Docker**     | Containerization    | Run database easily           |
| **Redis**      | Cache database      | Speed up the system           |

---

## 📦 Prerequisites

Before starting, install these on your computer:

### 1. **Node.js** (JavaScript Runtime)

- Download: https://nodejs.org/ (LTS version 18+)
- Check installation:
  ```bash
  node --version    # Should show v18 or higher
  npm --version     # Should show 9 or higher
  ```

### 2. **Git** (Version Control)

- Download: https://git-scm.com/
- Check installation:
  ```bash
  git --version
  ```

### 3. **Docker Desktop** (For Database)

- Download: https://www.docker.com/products/docker-desktop
- Check installation:
  ```bash
  docker --version
  ```

### 4. **Code Editor**

- Use **Visual Studio Code** (Free): https://code.visualstudio.com/
- Or any text editor you prefer

### 5. **Postman** (API Testing - Optional)

- Download: https://www.postman.com/
- Used to test API endpoints

---

## ⚙️ Complete Setup Guide

Follow these steps **EXACTLY** in order:

### Step 1: Clone the Repository

A **repository** is a folder with the entire project code. We'll download it to your computer.

```bash
git clone git@bitbucket.org:abdulshakoor1/resqlink-backend.git
cd resqlink-backend
```

**What you just did:**

- Downloaded the project from Bitbucket (git hosting service)
- Moved into the project folder

**Expected folder structure:**

```
resqlink-backend/
├── src/              (source code)
├── prisma/           (database schema)
├── package.json      (list of tools to install)
└── ...
```

### Step 2: Install Node Dependencies

**Dependencies** are pre-built code libraries that we use. Think of them as "building blocks" for our app.

```bash
npm install
```

**What happens:**

- `npm` reads `package.json` (list of dependencies)
- Downloads all tools and libraries
- Creates a `node_modules/` folder
- Takes 2-5 minutes

**You should see:** ✅ `added 500+ packages` at the end

---

### Step 3: Start PostgreSQL & Redis (Docker)

Docker is a tool that runs **databases in containers** (like a virtual computer). No need to install PostgreSQL manually!

```bash
docker-compose up -d
```

**What this does:**

- Reads `docker-compose.yml` file
- Starts PostgreSQL database on port 5433
- Starts Redis cache on port 6379
- `-d` flag means "run in background"

**Verify containers started:**

```bash
docker ps
```

**You should see:**

```
CONTAINER ID    IMAGE              PORTS
abc12345...     postgres:16        0.0.0.0:5433->5432/tcp
def67890...     redis:7            0.0.0.0:6379->6379/tcp
```

**Port Conflict?** If port 5433 is taken:

- Edit `docker-compose.yml`
- Change `"5433:5432"` to `"5434:5432"`
- Update `.env` file accordingly (see next step)

---

### Step 4: Create `.env` File

The **`.env` file** stores secret configuration (passwords, API keys). Never commit this to git!

Create a file named `.env` in the project root:

```env
# Database Connection
DATABASE_URL="postgresql://resqlink:resqlink@localhost:5433/resqlink_db?schema=public"

# JWT Tokens (Secret keys for user authentication)
JWT_ACCESS_SECRET="super-secret-access-key-resqlink-2026"
JWT_REFRESH_SECRET="super-secret-refresh-key-resqlink-2026"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="30d"

# Server Port
PORT=3001
```

**Breaking it down:**

| Variable              | Meaning                              |
| --------------------- | ------------------------------------ |
| `DATABASE_URL`        | How to connect to PostgreSQL         |
| `resqlink` (username) | Default user in Docker               |
| `resqlink` (password) | Default password in Docker           |
| `localhost:5433`      | Database location & port             |
| `JWT_*_SECRET`        | Secret keys for login tokens         |
| `PORT=3001`           | Server runs on http://localhost:3001 |

**Why the secrets?** If someone gets your JWT secret, they can fake login tokens. Never share this file!

---

### Step 5: Generate Prisma Client

**Prisma** is a tool that generates code to interact with the database. We need to generate that code first.

```bash
npx prisma generate
```

**What it does:**

- Reads `prisma/schema.prisma` (database structure definition)
- Generates TypeScript code for database queries
- Creates `node_modules/@prisma/client`

You should see:

```
✔ Generated Prisma Client
```

---

### Step 6: Run Database Migrations

**Migrations** are like "version control for your database". They create tables, columns, and indexes.

```bash
npx prisma migrate deploy
```

**What this does:**

- Reads migration files from `prisma/migrations/`
- Creates all database tables
- Creates database structure (schema)
- Establishes relationships between tables

**Expected output:**

```
✔ Your database has been successfully migrated
```

---

### Step 7: Seed the Database (Optional)

**Seeding** means adding fake test data to the database. This helps you test the app without adding data manually.

```bash
npm run seed
```

**What it creates:**

- 1 Admin user
- 1 Patient user
- 1 Driver user
- 1 Paramedic user
- 5 Hospitals
- 3 Ambulances
- 2 Organizations
- 10 Sample ride requests

### Test Credentials (After Seeding)

Use these to login and test:

| Role      | Email                  | Password       |
| --------- | ---------------------- | -------------- |
| Admin     | admin@resqlink.com     | Admin@1234     |
| Patient   | patient@resqlink.com   | Patient@1234   |
| Driver    | driver@resqlink.com    | Driver@1234    |
| Paramedic | paramedic@resqlink.com | Paramedic@1234 |

---

## 🚀 Running the Project

### Development Mode (Recommended for Learning)

```bash
npm run start:dev
```

**What it does:**

- Starts the server on `http://localhost:3001`
- **Auto-reloads** when you change code (hot-reload)
- Shows logging in terminal

**Expected output:**

```
[NestFactory] Starting Nest application...
[InstanceLoader] TypeOrmModule dependencies initialized
...
[NestApplication] Nest application successfully started +2571ms
[LOG] Server listening on port 3001
```

### Production Build (For Deployment)

```bash
# Build the project
npm run build

# Run the built version
npm run start:prod
```

---

## ✅ Verify Everything Works

Open your browser or Postman and test these URLs:

### 1. **API Health Check**

```
GET http://localhost:3001/api
```

Should return: `{ "message": "Welcome to ResQLink API" }`

### 2. **Swagger API Docs** (Interactive Documentation)

```
http://localhost:3001/api/docs
```

Opens a page showing all API endpoints with ability to test them

### 3. **Admin Dashboard**

```
http://localhost:3001/admin
```

Opens the admin web interface

### 4. **Database Browser** (Prisma Studio)

```bash
npx prisma studio
```

Opens `http://localhost:5555` - visual database browser

---

## 📚 Understanding the Code

### Project Structure

```
resqlink-backend/
│
├── src/
│   ├── main.ts                  ← Entry point (starts the app)
│   ├── app.module.ts            ← Root module (imports all features)
│   │
│   ├── common/                  ← Shared code
│   │   └── prisma/
│   │       └── prisma.service.ts ← Database service
│   │
│   ├── config/                  ← Configuration
│   │   └── config.module.ts
│   │
│   └── modules/                 ← Features (13 modules)
│       ├── auth/                ← Login/Register
│       ├── users/               ← User profiles
│       ├── ambulances/          ← Fleet management
│       ├── ride-requests/       ← Booking system
│       ├── dispatch/            ← Smart matching
│       ├── tracking/            ← GPS tracking
│       ├── chats/               ← Messaging
│       ├── hospitals/           ← Hospital data
│       ├── organizations/       ← Company management
│       ├── paramedic-profiles/  ← Staff info
│       ├── driver-performance/  ← Analytics
│       ├── admin-actions/       ← Audit logs
│       └── admin-stats/         ← Dashboard
│
├── prisma/
│   ├── schema.prisma            ← Database structure
│   ├── migrations/              ← Database versions
│   └── seed.ts                  ← Test data
│
├── test/                        ← Tests
│   └── app.e2e-spec.ts
│
└── package.json                 ← Dependencies list
```

### Key Concepts

#### 1. **Controllers** (Routes)

Define which URLs exist and what they do.

```typescript
// src/modules/ambulances/ambulances.controller.ts

@Get() // GET /api/ambulances
getAll() {
  return this.service.getAll();
}
```

#### 2. **Services** (Business Logic)

Contains the actual code that does work.

```typescript
// src/modules/ambulances/ambulances.service.ts

getAll() {
  return this.prisma.ambulance.findMany();
}
```

#### 3. **Modules** (Feature Packages)

Groups related controller + service together.

```typescript
// src/modules/ambulances/ambulances.module.ts

@Module({
  controllers: [AmbulancesController],
  providers: [AmbulancesService],
})
export class AmbulancesModule {}
```

#### 4. **DTOs** (Data Validation)

Validates incoming data from clients.

```typescript
// src/modules/ambulances/dto/create-ambulance.dto.ts

export class CreateAmbulanceDto {
  @IsString()
  name: string;

  @IsEnum(AmbulanceType)
  type: AmbulanceType;
}
```

---

## 📡 API Documentation

### Authentication (Token-Based)

All protected endpoints need a JWT token in the header:

```
Authorization: Bearer <your_jwt_token>
```

**Getting a Token:**

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "patient@resqlink.com",
  "password": "Patient@1234"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "user": {
    "id": "uuid",
    "email": "patient@resqlink.com",
    "role": "USER"
  }
}
```

### Core Endpoints

#### **1. Authentication**

```
POST   /api/auth/register         - Register new account
POST   /api/auth/login            - Login & get token
POST   /api/auth/refresh-token    - Refresh token
```

#### **2. Users**

```
GET    /api/users/:id             - Get user profile
PATCH  /api/users/:id             - Update profile
DELETE /api/users/:id             - Delete account
GET    /api/users/my-rides        - Get my ride history
```

#### **3. Ambulances** (Admin only)

```
POST   /api/ambulances            - Add ambulance
GET    /api/ambulances            - List all
GET    /api/ambulances/:id        - Get details
PATCH  /api/ambulances/:id        - Update
DELETE /api/ambulances/:id        - Delete
```

#### **4. Ride Requests** (Main Feature)

```
POST   /api/ride-requests         - Create ride (Patient)
GET    /api/ride-requests         - List rides (Admin)
GET    /api/ride-requests/:id     - Get ride details
PATCH  /api/ride-requests/:id/status - Update status
POST   /api/ride-requests/:id/rate    - Rate ride
POST   /api/ride-requests/:id/pay     - Process payment
```

#### **5. Dispatch** (Smart Matching)

```
POST   /api/dispatch/send         - Find & notify drivers
POST   /api/dispatch/:id/accept    - Driver accepts
POST   /api/dispatch/:id/reject    - Driver rejects
```

#### **6. Tracking** (GPS)

```
POST   /api/tracking/update       - Update location (Driver)
GET    /api/tracking/live         - Get all ambulance locations
GET    /api/tracking/:ambulanceId - Get specific location
```

#### **7. Chats** (Messaging)

```
POST   /api/chats/:rideId/message - Send message
GET    /api/chats/:rideId         - View chat history
```

#### **8. Admin Stats**

```
GET    /api/admin-stats           - Get dashboard data
```

---

### Example: Book an Ambulance

```bash
# 1. Register as patient
POST http://localhost:3001/api/auth/register
{
  "email": "myemail@gmail.com",
  "password": "MyPassword123",
  "name": "John Doe",
  "phone": "+1234567890",
  "role": "USER"
}

# 2. Login
POST http://localhost:3001/api/auth/login
{
  "email": "myemail@gmail.com",
  "password": "MyPassword123"
}
# Response: { "accessToken": "eyJ..." }

# 3. Create ride request
POST http://localhost:3001/api/ride-requests
Authorization: Bearer eyJ...
{
  "pickupLocation": "123 Main St",
  "pickupLat": 40.7128,
  "pickupLng": -74.0060,
  "destination": "Hospital XYZ",
  "dropoffLat": 40.7580,
  "dropoffLng": -73.9855,
  "ambulanceType": "BASIC"
}

# 4. Track ambulance location (WebSocket)
# Connect to: ws://localhost:3001/tracking
# Listen for: location updates
```

---

## 🧪 Testing APIs

### Using Postman (Recommended for Beginners)

1. **Download Postman**: https://www.postman.com/downloads/
2. **Create new request**
3. **Set method**: POST, GET, etc.
4. **Set URL**: http://localhost:3001/api/auth/login
5. **Set headers**:
   - `Content-Type: application/json`
   - `Authorization: Bearer <token>` (for protected routes)
6. **Set body** (JSON):
   ```json
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```
7. **Click Send**

### Using cURL (Command Line)

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@resqlink.com","password":"Patient@1234"}'

# Get user (with token)
curl -X GET http://localhost:3001/api/users/123 \
  -H "Authorization: Bearer eyJ..."
```

### Using Swagger (Browser)

Visit: `http://localhost:3001/api/docs`

- See all endpoints
- Test directly in browser
- View request/response examples

---

## 🔐 Role-Based Access Control (RBAC)

The system has **4 user roles** with different permissions:

| Role               | Permissions                                           |
| ------------------ | ----------------------------------------------------- |
| **ADMIN**          | Full access, manage users & ambulances, view all data |
| **DRIVER**         | Accept rides, update location, chat with patient      |
| **PARAMEDIC**      | View assigned rides, access to medical equipment      |
| **USER** (Patient) | Create rides, view own rides, rate service, pay       |

**Example:**

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Delete('/users/:id')
deleteUser() { ... }  // Only ADMIN can delete users
```

---

## 📊 Database Schema Overview

### Key Tables

```
┌─────────────────────────────────────────┐
│              USER (Accounts)            │
├─────────────────────────────────────────┤
│ id         | UUID (unique identifier)   │
│ email      | String (unique)            │
│ phone      | String (unique)            │
│ name       | String                     │
│ role       | ADMIN | DRIVER | USER | .. │
│ verified   | Boolean                    │
│ created_at | DateTime                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│       RIDE_REQUEST (Bookings)           │
├─────────────────────────────────────────┤
│ id            | UUID                    │
│ userId        | FK → User               │
│ driverId      | FK → User (nullable)    │
│ status        | CREATED → COMPLETED     │
│ pickupLat     | Float                   │
│ pickupLng     | Float                   │
│ dropoffLat    | Float                   │
│ dropoffLng    | Float                   │
│ fare          | Decimal                 │
│ createdAt     | DateTime                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│        AMBULANCE (Fleet)                │
├─────────────────────────────────────────┤
│ id             | UUID                   │
│ registrationNo | String (unique)        │
│ driverId       | FK → Driver User       │
│ type           | BASIC | WITH_DOCTOR    │
│ status         | AVAILABLE | BUSY | ... │
│ lat            | Float (GPS)            │
│ lng            | Float (GPS)            │
│ organizationId | FK → Organization      │
└─────────────────────────────────────────┘
```

**FK = Foreign Key** (reference to another table)

---

## 🛠️ Common Commands

```bash
# Development
npm run start:dev              # Run with auto-reload
npm run start:debug           # Run with debugger

# Building & Production
npm run build                 # Compile TypeScript
npm run start:prod            # Run compiled version

# Database
npx prisma migrate dev --name <name>  # Create new migration
npx prisma migrate reset              # Reset DB (DELETE ALL DATA)
npx prisma studio                     # Visual DB browser
npm run seed                          # Add test data

# Testing
npm run test                  # Run unit tests
npm run test:watch            # Watch mode
npm run test:cov              # Coverage report
npm run test:e2e              # E2E tests

# Code Quality
npm run lint                  # Check code style
npm run lint --fix            # Auto-fix style issues
npm run format                # Format with Prettier

# Docker
docker-compose up -d          # Start containers
docker-compose down           # Stop containers
docker-compose logs postgres  # View PostgreSQL logs
docker-compose logs redis     # View Redis logs

# Database Connection (Direct)
docker exec -it resqlink_postgres psql -U resqlink -d resqlink_db
# Then you can run SQL commands
```

---

## 🐛 Troubleshooting

### ❌ "Port 3001 is already in use"

**Cause**: Another app is using port 3001

**Solution:**

```bash
# Windows (Find what's using port 3001)
netstat -ano | findstr :3001

# Change port in .env
PORT=3002  # Change from 3001 to 3002
```

### ❌ "Cannot find module '@nestjs/common'"

**Cause**: Dependencies not installed

**Solution:**

```bash
npm install
npx prisma generate
```

### ❌ "Error: connect ECONNREFUSED 127.0.0.1:5433"

**Cause**: Docker database not running

**Solution:**

```bash
docker-compose up -d
docker ps  # Verify containers started
```

### ❌ "Error: ADMIN role self-registration blocked"

**Cause**: Trying to register as ADMIN (security feature)

**Solution:**

- Register as USER, DRIVER, or PARAMEDIC
- Admin accounts are created by existing admins

### ❌ "Prisma Client not found"

**Cause**: Prisma code not generated

**Solution:**

```bash
npx prisma generate
```

### ❌ "Bearer token required" error

**Cause**: Missing Authorization header

**Solution:**

```bash
# Add to request header
Authorization: Bearer <your_jwt_token>
```

### 🆘 Still stuck?

1. Check terminal error message carefully
2. Verify `.env` file has correct values
3. Ensure Docker is running: `docker ps`
4. Try restarting: `npm run start:dev`
5. Clear node_modules: `rm -r node_modules` → `npm install`

---

## 📖 Learning Resources

### Understanding each Technology

| Technology            | Learn It Here                       | Time     |
| --------------------- | ----------------------------------- | -------- |
| **JavaScript Basics** | https://javascript.info             | 20 hours |
| **TypeScript**        | https://www.typescriptlang.org/docs | 5 hours  |
| **Node.js Basics**    | https://nodejs.org/en/docs          | 5 hours  |
| **NestJS Tutorial**   | https://docs.nestjs.com             | 10 hours |
| **Prisma ORM**        | https://www.prisma.io/docs          | 5 hours  |
| **REST APIs**         | https://restfulapi.net              | 5 hours  |
| **WebSockets**        | https://socket.io/docs              | 3 hours  |
| **SQL/PostgreSQL**    | https://www.postgresql.org/docs     | 8 hours  |

### Recommended Order to Learn

1. **JavaScript** - Foundation for everything
2. **TypeScript** - Type safety (optional but recommended)
3. **Node.js** - How backend works
4. **REST APIs** - Understanding HTTP requests
5. **NestJS** - The framework we're using
6. **PostgreSQL** - Database
7. **Prisma** - How to query database
8. **WebSockets** - Real-time features

---

## 📝 Project Files Guide

| File                   | Purpose                                       |
| ---------------------- | --------------------------------------------- |
| `package.json`         | Lists all dependencies & scripts              |
| `tsconfig.json`        | TypeScript settings                           |
| `nest-cli.json`        | NestJS CLI settings                           |
| `.env`                 | Secret configuration (⚠️ Never commit to git) |
| `docker-compose.yml`   | Database container config                     |
| `prisma/schema.prisma` | Database structure definition                 |
| `src/main.ts`          | Application start point                       |
| `src/app.module.ts`    | Root module (imports everything)              |
| `src/modules/*/`       | Feature modules (13 total)                    |

---

## 🚀 Deployment (For Later)

Once your app is ready for production:

```bash
# 1. Build
npm run build

# 2. Deploy to Heroku/Railway/Render/AWS
# (Follow hosting provider's guide)

# 3. Set environment variables on hosting platform
# (Add .env variables to platform dashboard)

# 4. Your API is live!
```

Popular hosting: Heroku, Railway.app, Render, AWS, Google Cloud, Azure

---

## 📞 Getting Help

- **NestJS Docs**: https://docs.nestjs.com
- **Prisma Docs**: https://www.prisma.io/docs
- **Stack Overflow**: Tag your questions with `nestjs` `prisma` `postgresql`
- **GitHub Issues**: Check project issues for solutions
- **ChatGPT/Claude**: Ask AI for coding help

---

## 📄 License

UNLICENSED - Educational project

---

## ✏️ Next Steps

### If you're a **Beginner Programmer**:

1. ✅ Complete setup (you just did this!)
2. Browse the API docs at `/api/docs`
3. Try making API calls with Postman
4. Read code in `src/modules/auth/` (simplest module)
5. Modify one endpoint
6. Add a new endpoint

### If you're a **NestJS Developer**:

1. ✅ Setup complete
2. Review the 13 modules
3. Understand the dispatch algorithm
4. Set up real-time tracking (WebSocket)
5. Add new features or optimize existing ones

### If you're **Deploying**:

1. ✅ Local setup works
2. Configure `.env` for production
3. Use managed PostgreSQL (AWS RDS, Railway, etc.)
4. Deploy to hosting (Heroku, Railway, Render, etc.)
5. Monitor logs and errors

---

**Happy coding! 🎉**

For detailed module-by-module breakdown, see [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

---

## Available URLs

| Purpose                          | URL                            | What You'll See               |
| -------------------------------- | ------------------------------ | ----------------------------- |
| **API Base**                     | http://localhost:3001/api      | API health check              |
| **Swagger Docs**                 | http://localhost:3001/api/docs | Interactive API documentation |
| **Admin Dashboard**              | http://localhost:3001/admin    | Web admin interface           |
| **Database GUI**                 | http://localhost:5555          | Prisma Studio (visual DB)     |
| **Server**                       | http://localhost:3001          | API responses                 |
| `http://localhost:3001/api`      | API base                       |
| `http://localhost:3001/api/docs` | Swagger documentation          |
| `http://localhost:3001/admin`    | Admin dashboard                |

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

| Role      | Access Level                                  |
| --------- | --------------------------------------------- |
| ADMIN     | Full system access, dashboard, audit logs     |
| USER      | Request rides, track ambulance, chat          |
| DRIVER    | Accept rides, update location, complete trips |
| PARAMEDIC | View assigned rides, update medical notes     |

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
