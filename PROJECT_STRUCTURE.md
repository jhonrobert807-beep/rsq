# ResQLink Backend - Project Structure & Module Guide

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NESTJS APPLICATION                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  HTTP ROUTES + WEBSOCKET (Socket.io)                │  │
│  │  - REST API Endpoints (/api/*)                       │  │
│  │  - WebSocket Events (/tracking, /chat)              │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  MODULES (Business Logic Layer)                      │  │
│  │  - Auth, Users, Ambulances, Dispatch, etc.          │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  SERVICES + ORM (Data Access Layer)                  │  │
│  │  - Prisma ORM                                        │  │
│  │  - Database Service                                  │  │
│  │  - Business Logic                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  DATABASES                                            │  │
│  │  - PostgreSQL (Primary Data Store)                   │  │
│  │  - Redis (Cache & WebSocket Events)                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Tree Structure

```
resqlink-backend/
│
├── src/                           # SOURCE CODE
│   ├── main.ts                    # Application entry point (bootstrap)
│   ├── app.module.ts              # Root module (imports all features)
│   ├── app.controller.ts          # Root API controller
│   ├── app.service.ts             # Root service
│   │
│   ├── common/                    # SHARED UTILITIES
│   │   ├── common.module.ts       # Shared module exports
│   │   └── prisma/
│   │       └── prisma.service.ts  # Database client wrapper
│   │
│   ├── config/                    # CONFIGURATION
│   │   └── config.module.ts       # Environment variables module
│   │
│   └── modules/                   # FEATURE MODULES (Business Logic)
│       ├── auth/                  # Authentication & Authorization
│       ├── users/                 # User Management
│       ├── ambulances/            # Ambulance Fleet Management
│       ├── dispatch/              # SmartDispatch Algorithm
│       ├── ride-requests/         # Ride Request Management
│       ├── tracking/              # Real-time GPS Tracking
│       ├── chats/                 # In-ride Messaging (WebSocket)
│       ├── hospitals/             # Hospital Network Management
│       ├── organizations/         # Organization Management
│       ├── paramedic-profiles/    # Paramedic Information
│       ├── driver-performance/    # Driver Analytics
│       ├── admin-actions/         # Admin Action Logging
│       └── admin-stats/           # Dashboard Statistics
│
├── prisma/                        # DATABASE SCHEMA & MIGRATIONS
│   ├── schema.prisma              # Database structure definition
│   ├── seed.ts                    # Initial data seeding
│   ├── config.ts                  # Prisma configuration
│   └── migrations/                # Database migration history
│
├── test/                          # END-TO-END TESTS
│   └── app.e2e-spec.ts           # API testing
│
├── admin/                         # WEB DASHBOARD (Served as static)
│   ├── index.html
│   ├── login.html
│   └── dashboard.html
│
├── docs/                          # PROJECT DOCUMENTATION
│   └── WEEK_*.md                  # Development progress notes
│
├── docker-compose.yml             # Database containers (PostgreSQL + Redis)
├── package.json                   # Dependencies & scripts
├── tsconfig.json                  # TypeScript configuration
├── eslint.config.mjs              # Code linting rules
├── nest-cli.json                  # NestJS CLI configuration
└── README.md                       # Project overview
```

---

## Modules Breakdown (Module-by-Module Guide)

### 1. **Auth Module** (`src/modules/auth/`)

**Purpose**: User authentication and authorization system

**Files**:

- `auth.service.ts` - Core auth logic (login, register, token generation)
- `auth.controller.ts` - API endpoints for auth
- `jwt.strategy.ts` - JWT validation strategy
- `jwt-auth.guard.ts` - Protects routes requiring authentication
- `roles.guard.ts` - Role-based access control (ADMIN, DRIVER, USER, PARAMEDIC)
- `current-user.decorator.ts` - Extract user from request
- `roles.decorator.ts` - Define required role for endpoint

**Key Features**:

```
✓ User Registration (email/phone + password)
✓ User Login (returns JWT token)
✓ Token Refresh (refresh token rotation)
✓ Password Hashing (bcrypt SHA-256)
✓ Role-Based Access Control (RBAC)
✓ JWT Token Validation
```

**DTOs**:

- `login.dto.ts` - Login credentials
- `register.dto.ts` - Registration data
- `refresh-token.dto.ts` - Token refresh request

---

### 2. **Users Module** (`src/modules/users/`)

**Purpose**: User profile management and user-related operations

**Files**:

- `users.service.ts` - User CRUD operations
- `users.controller.ts` - User API endpoints
- `users.module.ts` - Module configuration

**Key Features**:

```
✓ Get User Profile
✓ Update Profile (name, phone, location)
✓ Delete Account
✓ View User's Ride History
✓ User Location Updates (last known location)
```

**Protected By**: JWT Auth Guard + Roles Guard

---

### 3. **Ambulances Module** (`src/modules/ambulances/`)

**Purpose**: Fleet management and ambulance operations

**Files**:

- `ambulances.service.ts` - Ambulance operations
- `ambulances.controller.ts` - Fleet endpoints
- `ambulances.module.ts` - Module setup

**Key Features**:

```
✓ Register Ambulance (create, update, delete)
✓ Assign Driver to Ambulance
✓ Update Ambulance Status (AVAILABLE, BUSY, OFFLINE, MAINTENANCE)
✓ Track Ambulance Type (BASIC, WITH_DOCTOR)
✓ List Available Ambulances
✓ View Ambulance Details
```

**DTOs**:

- `create-ambulance.dto.ts` - New ambulance registration
- `update-ambulance.dto.ts` - Ambulance updates

---

### 4. **Dispatch Module** (`src/modules/dispatch/`)

**Purpose**: Smart algorithm for matching ride requests to nearest available ambulances

**Files**:

- `dispatch.service.ts` - Core dispatch algorithm
- `dispatch.controller.ts` - Dispatch API endpoints
- `dispatch-timeout.service.ts` - Handles timeout logic
- `dispatch.module.ts` - Module configuration

**Key Algorithm**:

```
1. User creates ride request
   ↓
2. System finds nearby available ambulances (within X km)
   ├─ Uses Haversine distance formula (GPS math)
   ├─ Filters by ambulance type
   └─ Sorts by distance (nearest first)
   ↓
3. Send dispatch requests to nearest ambulances
   ├─ Driver gets notification
   ├─ Driver accepts/rejects
   └─ If rejected → try next nearest (retry logic)
   ↓
4. First to accept is assigned to ride request
```

**Features**:

```
✓ Haversine distance calculation (GPS distance)
✓ Nearest ambulance finding
✓ Parallel dispatch to multiple drivers
✓ Timeout handling (if no response)
✓ Fallback to next ambulance
✓ Track dispatch history
```

**DTOs**:

- `dispatch-request.dto.ts` - Dispatch parameters

---

### 5. **Ride Requests Module** (`src/modules/ride-requests/`)

**Purpose**: Core ride booking and management system

**Files**:

- `ride-requests.service.ts` - Ride request operations
- `ride-requests.controller.ts` - Ride endpoints
- `ride-requests.module.ts` - Module setup

**Ride Lifecycle**:

```
CREATED → DISPATCHING → WAITING_DRIVER_ACCEPT → DRIVER_ACCEPTED
  → DRIVER_ARRIVED → IN_TRIP → COMPLETED

OR → CANCELLED / FAILED_NO_DRIVER
```

**Key Features**:

```
✓ Create Ride Request (patient specifies pickup/dropoff)
✓ View My Rides (user-specific history)
✓ Update Status (user/driver/admin state changes)
✓ Rate Ride (patient rates ambulance service)
✓ Process Payment (cash, card, wallet)
✓ Reassign Ride (admin can reassign to different ambulance)
✓ Cancel Ride
```

**DTOs**:

- `create-ride-request.dto.ts` - New ride parameters
- `update-ride-request-status.dto.ts` - Status updates
- `rate-ride.dto.ts` - Rating submission
- `update-payment.dto.ts` - Payment processing
- `reassign-ride.dto.ts` - Admin reassignment

---

### 6. **Tracking Module** (`src/modules/tracking/`)

**Purpose**: Real-time GPS location updates and ambulance tracking

**Files**:

- `tracking.service.ts` - Location tracking operations
- `tracking.controller.ts` - REST endpoints for fallback
- `tracking.gateway.ts` - **WebSocket handler** for live updates
- `tracking.module.ts` - Module setup

**Communication Methods**:

```
Option 1: REST API (Fallback)
  Driver → POST /api/tracking/update → Server

Option 2: WebSocket (Primary - Real-time)
  Driver ↔ WebSocket /tracking namespace ↔ Server
  └─ Emit: update-location
  └─ Receive: live packets from other ambulances
```

**Key Features**:

```
✓ Update Driver Location (lat/lng)
✓ Broadcast to Patients (live ambulance location)
✓ Store Location History (optional)
✓ Calculate ETA to patient/hospital
✓ WebSocket events: real-time updates
✓ Get all live locations
```

**DTOs**:

- `update-location.dto.ts` - GPS coordinates

---

### 7. **Chats Module** (`src/modules/chats/`)

**Purpose**: In-ride messaging between patient and driver

**Files**:

- `chats.service.ts` - Chat operations
- `chats.controller.ts` - Chat endpoints
- `chats.gateway.ts` - **WebSocket handler** for messaging
- `chats.module.ts` - Module setup

**Technology**: Socket.io WebSocket

**Key Features**:

```
✓ Send Message (text/image)
✓ View Chat History (all messages in ride)
✓ Real-time Message Delivery (WebSocket)
✓ System Messages (ride status updates)
✓ Mark as Read
```

**DTOs**:

- `send-message.dto.ts` - Message content

---

### 8. **Hospitals Module** (`src/modules/hospitals/`)

**Purpose**: Hospital network and emergency service points

**Files**:

- `hospitals.service.ts` - Hospital operations
- `hospitals.controller.ts` - Hospital endpoints
- `hospitals.module.ts` - Module setup

**Key Features**:

```
✓ Register Hospital
✓ Update Hospital Info
✓ List All Hospitals
✓ Get Hospital Details
✓ Assign Ambulances to Hospital
✓ View Hospital Statistics
```

**DTOs**:

- `create-hospital.dto.ts` - New hospital
- `update-hospital.dto.ts` - Hospital updates

---

### 9. **Organizations Module** (`src/modules/organizations/`)

**Purpose**: Ambulance service organizations/companies

**Files**:

- `organizations.service.ts` - Organization CRUD
- `organizations.controller.ts` - Organization endpoints
- `organizations.module.ts` - Module setup

**Key Features**:

```
✓ Create Organization (ambulance company)
✓ Update Organization
✓ List Organizations
✓ Manage Organization Members (drivers)
✓ View Organization Ambulances
```

**DTOs**:

- `create-organization.dto.ts` - New organization
- `update-organization.dto.ts` - Updates

---

### 10. **Paramedic Profiles Module** (`src/modules/paramedic-profiles/`)

**Purpose**: Paramedic credentials and professional information

**Files**:

- `paramedic-profiles.service.ts` - Profile operations
- `paramedic-profiles.controller.ts` - Profile endpoints
- `paramedic-profiles.module.ts` - Module setup

**Key Features**:

```
✓ Create Paramedic Profile
✓ Update Credentials
✓ Verification Status (PENDING, VERIFIED, REJECTED)
✓ Certifications & Qualifications
✓ View Profile
```

**DTOs**:

- `create-paramedic-profile.dto.ts` - Profile data
- `update-paramedic-profile.dto.ts` - Updates

---

### 11. **Driver Performance Module** (`src/modules/driver-performance/`)

**Purpose**: Driver analytics and quality metrics

**Files**:

- `driver-performance.service.ts` - Analytics logic
- `driver-performance.controller.ts` - Performance endpoints
- `driver-performance.module.ts` - Module setup

**Key Features**:

```
✓ Calculate Driver Ratings (average stars)
✓ Track Completed Rides
✓ Monitor Acceptance Rate
✓ Track Driver Response Time
✓ View Driver Statistics Dashboard
✓ Generate Performance Reports
```

**Metrics Tracked**:

- Average rating
- Total completed rides
- Response time
- Acceptance/rejection rate
- Income earned

**DTOs**:

- `update-driver-performance.dto.ts` - Performance updates

---

### 12. **Admin Actions Module** (`src/modules/admin-actions/`)

**Purpose**: Audit logging for administrative operations

**Files**:

- `admin-actions.service.ts` - Logging logic
- `admin-actions.controller.ts` - Audit endpoints
- `admin-actions.module.ts` - Module setup

**Key Features**:

```
✓ Log Admin Actions (create, update, delete)
✓ Audit Trail (who did what, when)
✓ View Action History
✓ Filter by Admin/Action/Date
```

**DTOs**:

- `create-admin-action.dto.ts` - Action details

---

### 13. **Admin Stats Module** (`src/modules/admin-stats/`)

**Purpose**: Dashboard statistics and analytics for admins

**Files**:

- `admin-stats.service.ts` - Statistics calculations
- `admin-stats.controller.ts` - Stats endpoints
- `admin-stats.module.ts` - Module setup

**Key Features**:

```
✓ Total Users Count
✓ Total Rides Completed
✓ Total Revenue
✓ Average Rating
✓ Active Ambulances
✓ Peak Hours Analysis
✓ Geographic Distribution
✓ System Health Metrics
```

---

## Data Flow: Real-World Example

### **Scenario: Patient Books an Ambulance**

```
┌─────────────────────────────────────────────────────────────────┐
│  PATIENT (User)                                                 │
│  Opens App → Click "Book Ambulance"                            │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
        POST /api/ride-requests (with location)
                 ↓
┌────────────────────────────────────────────────────────────────┐
│  RIDE REQUESTS MODULE                                           │
│  ✓ Create ride request                                          │
│  ✓ Save to database (status: CREATED)                           │
│  ✓ Validate location                                            │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ↓
        Dispatch Service Triggered
                 ↓
┌────────────────────────────────────────────────────────────────┐
│  DISPATCH MODULE                                                │
│  ✓ Calculate patient's location (lat, lng)                     │
│  ✓ Find nearest AVAILABLE ambulances (Haversine formula)       │
│  ✓ Sort by distance                                             │
│  ✓ Send notification to top 3 nearest drivers                  │
│  ✓ Set timeout (e.g., 30 seconds)                              │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ↓
        WebSocket Notification to Drivers
                 ↓
┌────────────────────────────────────────────────────────────────┐
│  DRIVER 1 (Nearest - 2km away)                                  │
│  → Receives notification on phone                              │
│  → Choices: [ACCEPT] [REJECT]                                  │
│  → Clicks ACCEPT                                               │
│  ✓ Status changes to DRIVER_ACCEPTED                           │
│  ✓ Other drivers get cancellation notice                       │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ↓
        Location Streaming Begins
                 ↓
┌────────────────────────────────────────────────────────────────┐
│  TRACKING MODULE (WebSocket)                                    │
│  Driver sends GPS coords every 5 seconds                        │
│           ↓                                                    │
│  Patient receives live location updates                        │
│  → "Ambulance is 2 km away, ETA 8 mins"                       │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ↓
        When Driver Arrives at Patient Location
                 ↓
┌────────────────────────────────────────────────────────────────┐
│  RIDE REQUEST (Status Update)                                   │
│  Status: DRIVER_ARRIVED → IN_TRIP                             │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ↓
        During Trip - Chat & Tracking
                 ↓
┌────────────────────────────────────────────────────────────────┐
│  CHATS MODULE (WebSocket)                                       │
│  Patient can message driver                                    │
│  "How much longer to hospital?"                                │
│                                                                │
│  TRACKING MODULE                                                │
│  Live ambulance location continues                             │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ↓
        At Hospital - End Ride
                 ↓
┌────────────────────────────────────────────────────────────────┐
│  RIDE REQUEST (Final Status)                                    │
│  Status: IN_TRIP → COMPLETED                                  │
│  ✓ Calculate fare                                               │
│  ✓ Save completion timestamp                                   │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ↓
        Payment & Rating
                 ↓
┌────────────────────────────────────────────────────────────────┐
│  PAYMENT                                                        │
│  Patient pays: Cash/Card/Wallet                                │
│  Status: PENDING → PAID                                        │
│                                                                │
│  RATING                                                        │
│  Patient rates driver (1-5 stars + comment)                   │
│  → Updates DRIVER PERFORMANCE metrics                          │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ↓
        Admin Dashboard Updates
                 ↓
┌────────────────────────────────────────────────────────────────┐
│  ADMIN STATS MODULE                                             │
│  ✓ Increments total rides count                                │
│  ✓ Adds revenue to total                                       │
│  ✓ Updates driver stats                                        │
│  ✓ Records in ADMIN ACTIONS (audit log)                        │
└────────────────────────────────────────────────────────────────┘
```

---

## Module Dependencies Diagram

```
┌─────────────────────────────────────────────────┐
│           Config Module                         │  (Environment)
│  (Database URL, JWT Secrets, Port, etc.)       │
└────────────────────┬────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────┐
│           Common Module                         │  (Shared)
│  (Prisma Service - Database Client)            │
└────────────────────┬────────────────────────────┘
                     │
         ┌───────────┴──────────┬────────────┬─────────────┐
         │                      │            │             │
         ↓                      ↓            ↓             ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Auth Module     │  │  Users Module    │  │ Ambulances       │
│                  │  │                  │  │ Module           │
│ ✓ Login/Register │  │ ✓ Profile Mgmt   │  │ ✓ Fleet Mgmt     │
│ ✓ JWT Validation │  │ ✓ User CRUD      │  │ ✓ Lookbook       │
│ ✓ RBAC           │  │                  │  │ ✓ Status Mgmt    │
└────────┬─────────┘  └──────────────────┘  └──────────────────┘
         │
         └──────────────────┬──────────────────┐
                            │                  │
                            ↓                  ↓
                   ┌──────────────────┐ ┌──────────────────┐
                   │  Dispatch Module │ │ Ride Requests    │
                   │                  │ │ Module           │
                   │ ✓ Smart Matching │ │ ✓ Booking        │
                   │ ✓ Distance Calc  │ │ ✓ Status Updates │
                   │ ✓ Retry Logic    │ │ ✓ Payment        │
                   └──────┬───────────┘ │ ✓ Rating         │
                          │             └──────┬───────────┘
                          │                    │
                    ┌─────┴────────┬──────────┴┐
                    │              │           │
                    ↓              ↓           ↓
           ┌──────────────────┐ ┌──────────────────┐
           │ Tracking Module  │ │ Chats Module     │
           │                  │ │                  │
           │ ✓ Location Upd   │ │ ✓ Messaging      │
           │ ✓ WebSocket GPS  │ │ ✓ WebSocket      │
           │ ✓ Live Broadcast │ │ ✓ Message History│
           └──────────────────┘ └──────────────────┘
                    ↑                      ↑
                    │ (WebSocket)          │ (WebSocket)
                    └──────────┬───────────┘
                               │
                        ┌──────┴──────┐
                        │             │
                   Patients      Drivers
                  (Browsers)    (Mobile/Web)
```

---

## Core Technologies Used Per Module

| Module            | Key Tech                 | Purpose               |
| ----------------- | ------------------------ | --------------------- |
| **Auth**          | JWT + Passport + Bcrypt  | Secure authentication |
| **Users**         | Prisma ORM               | Profile management    |
| **Ambulances**    | Prisma ORM               | Fleet database        |
| **Dispatch**      | Haversine Math           | Distance calculation  |
| **Ride Requests** | Prisma ORM               | Core business logic   |
| **Tracking**      | Socket.io WebSocket      | Real-time GPS         |
| **Chats**         | Socket.io WebSocket      | Real-time messaging   |
| **Hospitals**     | Prisma ORM               | Hospital data         |
| **Organizations** | Prisma ORM               | Company management    |
| **Paramedics**    | Prisma ORM               | Staff management      |
| **Driver Perf**   | Prisma + Aggregation     | Analytics             |
| **Admin Stats**   | Prisma + SQL Aggregation | Dashboard data        |
| **Admin Actions** | Prisma ORM               | Audit logging         |

---

## API Route Structure

```
/api/
├── auth/
│   ├── POST   /register
│   ├── POST   /login
│   └── POST   /refresh-token
│
├── users/
│   ├── GET    /:id
│   ├── PATCH  /:id
│   ├── DELETE /:id
│   └── GET    /my-rides
│
├── ambulances/
│   ├── POST   / (create)
│   ├── GET    / (list)
│   ├── GET    /:id
│   ├── PATCH  /:id
│   └── DELETE /:id
│
├── ride-requests/
│   ├── POST   / (create ride)
│   ├── GET    / (all rides)
│   ├── GET    /:id
│   ├── PATCH  /:id/status
│   ├── POST   /:id/rate
│   ├── POST   /:id/pay
│   └── POST   /:id/reassign
│
├── dispatch/
│   ├── POST   /send (dispatch to drivers)
│   ├── POST   /:id/accept (driver accepts)
│   └── POST   /:id/reject (driver rejects)
│
├── tracking/
│   ├── POST   /update (REST fallback)
│   ├── GET    /live (all ambulance locations)
│   └── GET    /:ambulanceId (specific location)
│
├── chats/
│   ├── POST   /:rideId/message (send message)
│   └── GET    /:rideId (chat history)
│
├── hospitals/
│   ├── POST   / (create)
│   ├── GET    / (list)
│   ├── GET    /:id
│   └── PATCH  /:id
│
├── organizations/
│   ├── POST   / (create)
│   ├── GET    / (list)
│   ├── GET    /:id
│   └── PATCH  /:id
│
├── admin-stats/
│   └── GET    / (dashboard data)
│
└── admin-actions/
    └── GET    / (audit logs)

WebSocket Events:
/tracking → update-location (broadcast)
/chat     → send-message (per-ride)
```

---

## Summary Table: All 13 Modules

| #   | Module                 | Purpose                  | Type      | Key Tech       |
| --- | ---------------------- | ------------------------ | --------- | -------------- |
| 1   | **Auth**               | Login/Register/JWT       | Core      | Passport + JWT |
| 2   | **Users**              | Profile Management       | Core      | Prisma ORM     |
| 3   | **Ambulances**         | Fleet Management         | Core      | Prisma ORM     |
| 4   | **Dispatch**           | Smart Matching Algorithm | Core      | Haversine      |
| 5   | **Ride Requests**      | Booking System           | Core      | Prisma ORM     |
| 6   | **Tracking**           | Real-time GPS            | Real-time | Socket.io      |
| 7   | **Chats**              | In-ride Messaging        | Real-time | Socket.io      |
| 8   | **Hospitals**          | Hospital Network         | Support   | Prisma ORM     |
| 9   | **Organizations**      | Company Management       | Support   | Prisma ORM     |
| 10  | **Paramedic Profiles** | Staff Info               | Support   | Prisma ORM     |
| 11  | **Driver Performance** | Analytics                | Analytics | Prisma + Agg   |
| 12  | **Admin Actions**      | Audit Logging            | Admin     | Prisma ORM     |
| 13  | **Admin Stats**        | Dashboard Stats          | Admin     | Prisma + SQL   |

---

## File Naming Convention

Every module follows this structure:

```
module-name/
├── module-name.controller.ts    # HTTP Routes (endpoints)
├── module-name.service.ts       # Business Logic (functions)
├── module-name.module.ts        # Module Configuration
├── module-name.gateway.ts       # WebSocket (if real-time)
└── dto/
    ├── create-*.dto.ts          # Create request validation
    ├── update-*.dto.ts          # Update request validation
    └── *.dto.ts                 # Other data structures
```

**NestJS Naming Rules**:

- Controllers end with `.controller.ts`
- Services end with `.service.ts`
- Modules end with `.module.ts`
- Guards end with `.guard.ts`
- Strategies end with `.strategy.ts`
- Decorators end with `.decorator.ts`
- Gateways end with `.gateway.ts`
- DTOs end with `.dto.ts`

---

## Key Design Patterns Used

### 1. **Modular Architecture**

Each feature is a self-contained module with:

- Controller (routes)
- Service (logic)
- Module file (config)

### 2. **Dependency Injection**

```typescript
constructor(
  private readonly prisma: PrismaService,
  private readonly jwtService: JwtService
) {}
```

### 3. **Guard-Based RBAC**

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
deleteUser() { ... }
```

### 4. **DTO Validation**

```typescript
class CreateAmbulanceDto {
  @IsString() name: string;
  @IsEnum(AmbulanceType) type: string;
}
```

### 5. **ORM Abstraction**

All database operations go through Prisma:

```typescript
await this.prisma.user.findUnique({ where: { id } });
```

### 6. **WebSocket Namespaces**

Separate Socket.io namespaces for different features:

- `/tracking` - GPS tracking
- `/chat` - Messaging

---

This structure makes the codebase:
✅ **Scalable** - Easy to add new modules
✅ **Maintainable** - Each module is isolated
✅ **Testable** - Services can be mocked
✅ **Professional** - Follows NestJS best practices
