# 📊 Project Structure - Visual Flow Guide

**For visual learners. Understand the entire project at a glance.**

---

## 1️⃣ File Organization - Like a Building

```
ResQLink Backend Project
│
├─ Entry Point (main.ts)
│  └─ Like the front door of a building
│
├─ Root Module (app.module.ts)
│  └─ Like the main lobby that connects all departments
│
├─ 13 Feature Modules
│  ├─ Auth Module
│  ├─ User Module
│  ├─ Ambulance Module
│  ├─ Dispatch Module
│  ├─ Ride Request Module
│  ├─ Tracking Module
│  ├─ Chat Module
│  └─ ... (7 more)
│
├─ Database (PostgreSQL)
│  └─ Where all data is stored
│
├─ Configuration
│  ├─ .env (secrets)
│  └─ config files
│
└─ Tests
   └─ Check if everything works
```

---

## 2️⃣ How a Request Flows Through the Project

### Example: User Logs In

```
┌─────────────┐
│   Browser   │
│   POST /api/auth/login
│   {email, password}
└──────┬──────┘
       │ (1) Request comes in
       ↓
┌──────────────────────────┐
│  main.ts (Entry Point)   │
│  ├─ app = new NestFactory.create(AppModule)
│  └─ app.listen(3001)
└──────┬───────────────────┘
       │ (2) Routes request to app.module.ts
       ↓
┌──────────────────────────────────────┐
│  app.module.ts (Root Module)         │
│  ├─ imports: [AuthModule, ...]       │
│  └─ controllers: [AppController]
└──────┬───────────────────────────────┘
       │ (3) Finds Auth Module
       ↓
┌────────────────────────────────────────────┐
│  auth.module.ts (Auth Module Config)       │
│  ├─ imports: [JwtModule, PassportModule]
│  ├─ controllers: [AuthController]
│  └─ providers: [AuthService, JwtStrategy]
└──────┬─────────────────────────────────────┘
       │ (4) Routes to AuthController
       ↓
┌──────────────────────────────────────┐
│  auth.controller.ts                  │
│                                      │
│  @Post('login')                      │
│  login(@Body() dto: LoginDto) {      │
│    return this.authService.login(dto)
│  }
└──────┬───────────────────────────────┘
       │ (5) Validates with LoginDto
       │     ✓ Valid email? YES
       │     ✓ Password is string? YES
       │
       │ (6) Calls AuthService
       ↓
┌──────────────────────────────────────┐
│  auth.service.ts (Business Logic)    │
│                                      │
│  login(dto) {                        │
│    1. Find user in database
│    2. Check password
│    3. Create JWT token
│    4. Return tokens
│  }
└──────┬───────────────────────────────┘
       │ (7) Needs database access
       ↓
┌──────────────────────────────────────┐
│  prisma.service.ts (Database)        │
│                                      │
│  this.prisma.user.findUnique({...})  │
│  this.prisma.user.update({...})      │
└──────┬───────────────────────────────┘
       │ (8) Queries database
       ↓
┌──────────────────────────────────────┐
│  PostgreSQL (Actual Database)        │
│                                      │
│  SELECT * FROM users WHERE ...       │
│  UPDATE users SET ...                │
└──────┬───────────────────────────────┘
       │ (9) Returns user data
       ↓
┌──────────────────────────────────────┐
│  auth.service.ts                     │
│  Continues logic...                  │
│  Creates JWT token                   │
└──────┬───────────────────────────────┘
       │ (10) Returns token
       ↓
┌──────────────────────────────────────┐
│  auth.controller.ts                  │
│  Returns response                    │
└──────┬───────────────────────────────┘
       │ (11) Response sent to browser
       ↓
┌──────────────────────────┐
│    Browser               │
│    Response:             │
│    {                     │
│      accessToken: "...", │
│      user: {...}         │
│    }                     │
└──────────────────────────┘
```

---

## 3️⃣ Module Structure - Same Pattern for All

Every module has this structure:

```
Module (e.g., Auth)
│
├─ *.controller.ts
│  ├─ Defines routes: @Get(), @Post(), etc.
│  ├─ Receives incoming requests
│  ├─ Validates with DTOs
│  └─ Calls service
│
├─ *.service.ts
│  ├─ Contains business logic
│  ├─ Uses database (Prisma)
│  ├─ Processes data
│  └─ Returns result
│
├─ *.module.ts
│  ├─ Imports dependencies
│  ├─ Exports controller & service
│  └─ Configuration
│
└─ dto/
   ├─ *.dto.ts (Data Transfer Objects)
   └─ Validates incoming data
```

---

## 4️⃣ How Each Module Works (Same Pattern)

### Ambulance Module Example

```
GET /api/ambulances
        │
        ↓
@Get()
ambulances.controller.ts
        │
        ↓
this.ambulanceService.getAll()
        │
        ↓
ambulances.service.ts
        │
        ├─ this.prisma.ambulance.findMany()
        │
        ↓
        Database query
        │
        ↓
Returns list of ambulances
        │
        ↓
Response to browser
```

---

## 5️⃣ Complete File Structure with Purpose

```
resqlink-backend/
│
├─ src/
│  │
│  ├─ main.ts ✅ START HERE
│  │  ├─ async function bootstrap()
│  │  ├─ NestFactory.create(AppModule)
│  │  └─ app.listen(PORT)
│  │
│  ├─ app.module.ts 🔗 CONNECTS EVERYTHING
│  │  ├─ imports: [AuthModule, UsersModule, ...]
│  │  └─ All 13 modules listed here
│  │
│  ├─ common/ 🔧 SHARED CODE
│  │  └─ prisma.service.ts
│  │     └─ Provides database access to all modules
│  │
│  ├─ config/ ⚙️ CONFIGURATION
│  │  └─ Handles .env variables
│  │
│  └─ modules/ 🏢 BUSINESS LOGIC (13 modules)
│     │
│     ├─ auth/ 🔐
│     │  ├─ auth.controller.ts (Routes: /api/auth/login, /register)
│     │  ├─ auth.service.ts (Logic: validate password, create token)
│     │  ├─ auth.module.ts (Config)
│     │  ├─ jwt.strategy.ts (How to verify tokens)
│     │  ├─ jwt-auth.guard.ts (Allow/block routes)
│     │  ├─ roles.guard.ts (Check user role)
│     │  └─ dto/
│     │     ├─ login.dto.ts (Validate login data)
│     │     └─ register.dto.ts (Validate register data)
│     │
│     ├─ users/ 👤
│     │  ├─ users.controller.ts (Routes: GET /api/users/:id)
│     │  ├─ users.service.ts (Logic: get user, update profile)
│     │  ├─ users.module.ts
│     │  └─ dto/
│     │     └─ create-user.dto.ts
│     │
│     ├─ ambulances/ 🚑
│     │  ├─ ambulances.controller.ts (Routes: GET/POST /api/ambulances)
│     │  ├─ ambulances.service.ts (Logic: manage fleet)
│     │  ├─ ambulances.module.ts
│     │  └─ dto/
│     │     ├─ create-ambulance.dto.ts
│     │     └─ update-ambulance.dto.ts
│     │
│     ├─ dispatch/ 📍
│     │  ├─ dispatch.controller.ts
│     │  ├─ dispatch.service.ts (Haversine algorithm - find nearest ambulances)
│     │  ├─ dispatch-timeout.service.ts (Handle timeouts)
│     │  ├─ dispatch.module.ts
│     │  └─ dto/
│     │     └─ dispatch-request.dto.ts
│     │
│     ├─ ride-requests/ 📋
│     │  ├─ ride-requests.controller.ts (Routes: POST /api/ride-requests)
│     │  ├─ ride-requests.service.ts (Logic: book ride, manage status)
│     │  ├─ ride-requests.module.ts
│     │  └─ dto/
│     │     ├─ create-ride-request.dto.ts
│     │     ├─ update-ride-request-status.dto.ts
│     │     ├─ rate-ride.dto.ts
│     │     └─ update-payment.dto.ts
│     │
│     ├─ tracking/ 🛰️
│     │  ├─ tracking.controller.ts (Routes: POST/GET /api/tracking)
│     │  ├─ tracking.gateway.ts (WebSocket: /tracking namespace)
│     │  ├─ tracking.service.ts (Logic: update location, broadcast)
│     │  ├─ tracking.module.ts
│     │  └─ dto/
│     │     └─ update-location.dto.ts
│     │
│     ├─ chats/ 💬
│     │  ├─ chats.controller.ts (Routes: /api/chats)
│     │  ├─ chats.gateway.ts (WebSocket: /chat namespace)
│     │  ├─ chats.service.ts (Logic: send message, history)
│     │  ├─ chats.module.ts
│     │  └─ dto/
│     │     └─ send-message.dto.ts
│     │
│     ├─ hospitals/ 🏥
│     ├─ organizations/ 🏢
│     ├─ paramedic-profiles/ 👨‍⚕️
│     ├─ driver-performance/ 📊
│     ├─ admin-actions/ 📝
│     └─ admin-stats/ 📈
│
├─ prisma/
│  ├─ schema.prisma 📐 DATABASE STRUCTURE
│  │  ├─ model User { ... }
│  │  ├─ model Ambulance { ... }
│  │  ├─ model RideRequest { ... }
│  │  └─ ... (all other models)
│  │
│  ├─ migrations/ 📜 DATABASE VERSIONS
│  │  ├─ 20260114_init_schema_v1/
│  │  │  └─ migration.sql (Creates User, Ambulance, etc. tables)
│  │  └─ 20260303_add_user_rating/
│  │     └─ migration.sql (Adds new columns)
│  │
│  └─ seed.ts 🌱 TEST DATA
│     └─ Creates test users, ambulances, rides
│
├─ .env ⚠️ SECRETS (Never commit to git!)
│  ├─ DATABASE_URL=...
│  ├─ JWT_ACCESS_SECRET=...
│  └─ PORT=3001
│
├─ docker-compose.yml 🐳 DATABASE CONTAINER
│  ├─ PostgreSQL on port 5433
│  └─ Redis on port 6379
│
├─ package.json 📦 DEPENDENCIES
│  ├─ "npm install" downloads all packages
│  ├─ "npm run start:dev" starts app
│  ├─ "npm run build" builds for production
│  └─ "npm run seed" adds test data
│
└─ tsconfig.json ⚙️ TYPESCRIPT SETTINGS
   └─ How to compile .ts to .js
```

---

## 6️⃣ A User's Journey - Complete Flow

### Scenario: Patient Books Ambulance

```
STEP 1: Patient Opens Browser
┌──────────────────┐
│ http://localhost:3001
│ /admin (dashboard)
└──────────────────┘

STEP 2: Patient Registers
┌──────────────────┐
│ POST /api/auth/register
│ {email, password, name}
└──────┬───────────┘
       ↓
   RegisterDto validates ✓
       ↓
   auth.service.ts:
   - Hash password with bcrypt
   - Save to database
       ↓
   response: {success, userId}

STEP 3: Patient Logs In
┌──────────────────┐
│ POST /api/auth/login
│ {email, password}
└──────┬───────────┘
       ↓
   LoginDto validates ✓
       ↓
   auth.service.ts:
   - Find user in database
   - Compare password
   - Create JWT token
       ↓
   response: {accessToken, refreshToken}

STEP 4: Patient Books Ride
┌──────────────────────────┐
│ POST /api/ride-requests
│ Header: Authorization: Bearer <token>
│ Body: {pickupLat, pickupLng, destination}
└──────┬───────────────────┘
       ↓
   JwtAuthGuard checks token ✓
       ↓
   CreateRideRequestDto validates ✓
       ↓
   ride-requests.service.ts:
   - Save ride request to database
   - Status: CREATED
       ↓
   response: {rideId, status}

STEP 5: System Finds Nearest Ambulances
┌──────────────────┐
│ dispatch.service.ts
│ Haversine algorithm
└──────┬───────────┘
       ↓
   Find ambulances near patient
   Sort by distance
   Select 3 nearest
       ↓
   Send dispatch to drivers

STEP 6: Drivers Get Notified
┌──────────────────┐
│ WebSocket /dispatch
│ Notification to drivers
└──────┬───────────┘
       ↓
   Driver 1: 2km away (will accept in 5 sec)
   Driver 2: 5km away
   Driver 3: 8km away

STEP 7: Driver Accepts Ride
┌──────────────────┐
│ POST /api/dispatch/:rideId/accept
│ Header: Token (driver's)
└──────┬───────────┘
       ↓
   dispatch.service.ts:
   - Update ride status to DRIVER_ACCEPTED
   - Cancel requests to other drivers
   - Update ambulance status to BUSY

STEP 8: Real-time Tracking Starts
┌──────────────────┐
│ WebSocket /tracking
│ Driver sends location every 5 sec
└──────┬───────────┘
       ↓
   tracking.gateway.ts:
   - Receive lat, lng from driver
   - Broadcast to patient
   - Store location temporarily in Redis
       ↓
   Patient's app shows:
   "Ambulance is 1.5km away"

STEP 9: Driver Arrives at Patient Location
┌──────────────────┐
│ Status update:
│ DRIVER_ARRIVED → IN_TRIP
└──────┬───────────┘
       ↓
   ride-requests.service.ts:
   - Update status in database
   - Start trip timer

STEP 10: During Trip - Chat
┌──────────────────┐
│ WebSocket /chat
│ Patient: "How long to hospital?"
└──────┬───────────┘
       ↓
   chats.gateway.ts:
   - Save message to database
   - Send to driver's app

STEP 11: Arrive at Hospital
┌──────────────────┐
│ Status update:
│ IN_TRIP → COMPLETED
└──────┬───────────┘
       ↓
   ride-requests.service.ts:
   - Calculate fare
   - Set payment status to PENDING
   - Update ambulance status to AVAILABLE

STEP 12: Patient Pays
┌──────────────────┐
│ POST /api/ride-requests/:id/pay
│ {paymentMethod, amount}
└──────┬───────────┘
       ↓
   UpdatePaymentDto validates ✓
       ↓
   ride-requests.service.ts:
   - Update payment status to PAID
   - Save transaction to database

STEP 13: Patient Rates Driver
┌──────────────────┐
│ POST /api/ride-requests/:id/rate
│ {rating: 5, comment: "Good service"}
└──────┬───────────┘
       ↓
   RateRideDto validates ✓
       ↓
   ride-requests.service.ts:
   - Save rating to database
   - Update driver's average rating
   - driver-performance metrics updated

STEP 14: Admin Sees Statistics
┌──────────────────┐
│ GET /api/admin-stats
└──────┬───────────┘
       ↓
   admin-stats.service.ts:
   - Count total rides
   - Calculate total revenue
   - Get average rating
   - Find peak hours
       ↓
   Admin Dashboard shows:
   "Total Rides: 1000"
   "Total Revenue: $50,000"
```

---

## 7️⃣ Data Flow: Request → Response

```
┌─────────────────────────────────────────────┐
│ CLIENT (Browser/Mobile App)                 │
│ Sends: PUT /api/ambulances/123              │
│        {name: "Ambulance X", status: "BUSY"}│
└──────────────────┬──────────────────────────┘
                   │
                   │ HTTP Request
                   ↓
┌──────────────────────────────────────────────┐
│ SERVER (NestJS Application)                  │
│                                              │
│ 1. main.ts receives request                  │
│                                              │
│ 2. app.module.ts routes to AmbulancesModule │
│                                              │
│ 3. ambulances.controller.ts/@Put(':id')     │
│    ├─ Receives body: {name, status}         │
│    ├─ Validates with UpdateAmbulanceDto     │
│    │  ✓ name is string? YES                 │
│    │  ✓ status in ENUM? YES                 │
│    └─ Calls ambulances.service.update(id)   │
│                                              │
│ 4. ambulances.service.ts                    │
│    ├─ Check if ambulance exists             │
│    ├─ Prepare update data                   │
│    └─ Call this.prisma.ambulance.update()   │
│                                              │
│ 5. prisma.service.ts                        │
│    └─ Execute SQL: UPDATE ambulances...     │
│                                              │
│ 6. DATABASE (PostgreSQL)                    │
│    ├─ Find ambulance by ID                  │
│    ├─ Update columns                        │
│    └─ Return updated record                 │
│                                              │
│ 7. Back to ambulances.service.ts            │
│    └─ Return updated ambulance object       │
│                                              │
│ 8. Back to controller                       │
│    └─ Return response                       │
│                                              │
│ Response: {                                  │
│   id: "123",                                │
│   name: "Ambulance X",                      │
│   status: "BUSY",                           │
│   updatedAt: "2026-03-08T..."               │
│ }                                            │
└──────────────────┬──────────────────────────┘
                   │
                   │ HTTP Response (JSON)
                   ↓
┌──────────────────────────────────────────────┐
│ CLIENT (Browser/Mobile App)                  │
│ Receives: {id, name, status, updatedAt}     │
│ Updates UI: "Ambulance updated successfully"│
└──────────────────────────────────────────────┘
```

---

## 8️⃣ Database - How Data is Stored

```
PostgreSQL Database: resqlink_db
│
├─ User Table
│  ├─ Columns: id, email, name, passwordHash, role
│  └─ Rows: [admin, patient, driver, paramedic, ...]
│
├─ Ambulance Table
│  ├─ Columns: id, registrationNo, type, status, lat, lng
│  └─ Rows: [Ambulance #1, Ambulance #2, ...]
│
├─ RideRequest Table
│  ├─ Columns: id, userId (FK), driverId (FK), status, fare, createdAt
│  └─ Rows: [Ride #1, Ride #2, ...]
│
├─ Hospital Table
├─ Organization Table
├─ ChatMessage Table
├─ DispatchAttempt Table
└─ ... (more tables)

FK = Foreign Key (reference to another table)
Example: RideRequest.userId → points to User.id
```

---

## 9️⃣ WebSocket - Real-time Communication

```
Traditional HTTP Request/Response:
Client → Server → Response → Done (one-way)

WebSocket (Socket.io):
Client ↔ Server (two-way, always connected)

Example: Real-time Tracking

Ambulance (Driver's App)          Patient (Browser)
        │                              │
        │ WebSocket connection         │
        ├──────────────────────────────┤
        │ (Connection open)            │
        │                              │
        │ emit('location-update')      │
        │ {lat: 40.7, lng: -74.0}      │
        ├──────────────────────────────→
        │                              │
        │                    Receives location
        │                    Updates map
        │                              │
        │ emit('location-update')      │
        │ {lat: 40.71, lng: -74.01}    │
        ├──────────────────────────────→
        │                              │
        │ (Every 5 seconds)            │
        │                              │
        │  ... (repeat) ...            │
        │                              │
        │ emit('location-update')      │
        │ {lat: 40.73, lng: -74.02}    │
        ├──────────────────────────────→
        │ (Trip ends, connection closes)
        └──────────────────────────────┘
```

---

## 🔟 Authentication Flow

```
User Has NO Token
        ↓
POST /api/auth/login
{email: "john@gmail.com", password: "123"}
        ↓
Server creates JWT token with:
{
  sub: "user-id",
  email: "john@gmail.com",
  role: "USER",
  exp: 1234567890
}
        ↓
Signed with secret: "super-secret-key-2026"
        ↓
Response: {
  accessToken: "eyJhbGciOiJIUzI1NiIs...",
  refreshToken: "eyJhbGciOiJIUzI1NiIs...",
  user: {...}
}
        ↓
Browser stores token in memory/localStorage

---

Next Request to Protected Route:

GET /api/users/123
Header: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
        ↓
JwtAuthGuard:
├─ Extract token from header
├─ Verify with secret: "super-secret-key-2026"
├─ Check if expired
├─ Extract payload: {sub, email, role}
└─ Attach to request.user
        ↓
RolesGuard:
├─ Check required role: @Roles(Role.ADMIN)
├─ Check user role: "USER"
├─ Match? NO
└─ Reject with 403 Forbidden
        ↓
Response: {statusCode: 403, message: "Access denied"}

---

With Correct Role:

GET /api/ambulances
Header: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
        ↓
JwtAuthGuard: ✓ Token valid
        ↓
RolesGuard: ✓ Role is accepted (or no role required)
        ↓
Controller receives request with request.user = {id, email, role}
        ↓
Can use @CurrentUser() to get user info
        ↓
Service processes request using user.id
        ↓
Response: Data ✓
```

---

## Summary: What Happens Where

| What                 | Where      | File                      |
| -------------------- | ---------- | ------------------------- |
| User logs in         | Controller | auth.controller.ts        |
| Validates login data | DTO        | login.dto.ts              |
| Hashes password      | Service    | auth.service.ts           |
| Finds user           | Database   | PostgreSQL (via Prisma)   |
| Creates JWT token    | Service    | jwt.strategy.ts           |
| Protects routes      | Guard      | jwt-auth.guard.ts         |
| Checks user role     | Guard      | roles.guard.ts            |
| Extracts user info   | Decorator  | current-user.decorator.ts |
| Gets ambulances      | Controller | ambulances.controller.ts  |
| Finds nearest        | Algorithm  | dispatch.service.ts       |
| Provides location    | WebSocket  | tracking.gateway.ts       |
| Sends messages       | WebSocket  | chats.gateway.ts          |
| Stores data          | Database   | PostgreSQL tables         |
| Starts app           | Entry      | main.ts                   |
| Connects modules     | Root       | app.module.ts             |

---

## Quick Reference: Which File Does What?

```
*.controller.ts → Routes & HTTP endpoints
*.service.ts → Business logic & database operations
*.module.ts → Configuration & imports
*.guard.ts → Authentication & Authorization
*.strategy.ts → How to verify tokens
*.decorator.ts → Extract user from request
*.gateway.ts → WebSocket handling
*.dto.ts → Data validation
main.ts → Start the app
app.module.ts → Import all modules
schema.prisma → Database structure
migration.sql → Database changes
.env → Secret configuration
docker-compose.yml → Database containers
```

---

**Now you understand the entire project structure!** 🎉

All modules follow the same pattern:

1. Controller (routes)
2. Service (logic)
3. DTO (validation)
4. Module (config)

Master one module → understand all of them!
