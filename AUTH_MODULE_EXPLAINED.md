# 🔐 AUTH MODULE - Complete Explanation

**Learn ONE module completely. Then understand all others.**

---

## What Does AUTH Do?

The AUTH module lets users:

- Register (create account)
- Login (get token)
- Stay logged in (refresh token)

That's it. 3 things.

---

## Files in AUTH Module

```
src/modules/auth/
├── auth.controller.ts       ← Routes (URLs)
├── auth.service.ts          ← Business logic (code that does work)
├── auth.module.ts           ← Configuration (imports/exports)
├── jwt.strategy.ts          ← How to verify tokens
├── jwt-auth.guard.ts        ← Door guard (allows/blocks requests)
├── roles.guard.ts           ← Role checker (admin/user/driver)
├── decorators/
│   ├── current-user.decorator.ts    ← Get logged-in user
│   └── roles.decorator.ts            ← Mark required role
└── dto/
    ├── register.dto.ts      ← Register form validation
    ├── login.dto.ts         ← Login form validation
    └── refresh-token.dto.ts ← Refresh token validation
```

Let's understand each one.

---

## 1️⃣ Look at the Routes (Controller)

**File:** `auth.controller.ts`

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth') // ← URL prefix: /api/auth
export class AuthController {
  constructor(private authService: AuthService) {}

  // ============================================
  // ROUTE 1: Register (Create new account)
  // ============================================
  @Post('register') // ← POST /api/auth/register
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ============================================
  // ROUTE 2: Login (Get token)
  // ============================================
  @Post('login') // ← POST /api/auth/login
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ============================================
  // ROUTE 3: Refresh Token (Get new token)
  // ============================================
  @Post('refresh-token') // ← POST /api/auth/refresh-token
  refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }
}
```

**What this means:**

- Three URLs exist:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh-token`
- Each one calls a function in `AuthService`

---

## 2️⃣ Look at the Logic (Service)

**File:** `auth.service.ts`

This is where the REAL work happens.

### Register Function

```typescript
async register(dto: RegisterDto) {
  // Step 1: Check if user already exists
  const exists = await this.prisma.user.findUnique({
    where: { email: dto.email }  // ← Search in database
  });

  if (exists) {
    throw new Error('Email already used'); // ← Block duplicates
  }

  // Step 2: Hash the password (encrypted)
  const hashedPassword = await bcrypt.hash(
    dto.password,  // ← User's password
    10             // ← Security level (higher = slower but safer)
  );

  // Step 3: Create user in database
  const user = await this.prisma.user.create({
    data: {
      email: dto.email,
      name: dto.name,
      passwordHash: hashedPassword,  // ← Save hashed password (NOT plain text)
      role: dto.role
    }
  });

  // Step 4: Return success message
  return {
    message: 'User registered successfully',
    userId: user.id
  };
}
```

**What happens when user registers:**

1. Check if email exists → If yes, block registration
2. Hash password (never store plain passwords!)
3. Save user to database
4. Return success message

---

### Login Function

```typescript
async login(dto: LoginDto) {
  // Step 1: Find user by email
  const user = await this.prisma.user.findUnique({
    where: { email: dto.email }
  });

  if (!user) {
    throw new Error('User not found');  // ← Wrong email
  }

  // Step 2: Compare password
  const isPasswordCorrect = await bcrypt.compare(
    dto.password,      // ← Password user typed
    user.passwordHash  // ← Hashed password in database
  );

  if (!isPasswordCorrect) {
    throw new Error('Wrong password');  // ← Wrong password
  }

  // Step 3: Create JWT token (digital passport)
  const accessToken = this.jwtService.sign(
    {
      sub: user.id,        // ← User ID
      email: user.email,   // ← Email
      role: user.role      // ← Role (ADMIN/DRIVER/USER)
    },
    {
      secret: 'super-secret-key-2026',  // ← Secret key
      expiresIn: '15m'                   // ← Expires in 15 minutes
    }
  );

  const refreshToken = this.jwtService.sign(
    { sub: user.id },
    {
      secret: 'super-refresh-key-2026',
      expiresIn: '30d'  // ← Expires in 30 days
    }
  );

  // Step 4: Return tokens
  return {
    accessToken: accessToken,     // ← Use this for API calls
    refreshToken: refreshToken,   // ← Use this to get new accessToken
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  };
}
```

**What happens when user logs in:**

1. Find user by email → If not found, block login
2. Check password → If wrong, block login
3. Create JWT tokens:
   - **Access Token** = "digital passport" (15 min valid)
   - **Refresh Token** = "backup passport" (30 days valid)
4. Return tokens to user

---

### Refresh Token Function

```typescript
async refreshToken(dto: RefreshTokenDto) {
  // Step 1: Verify refresh token is valid
  const payload = this.jwtService.verify(
    dto.refreshToken,              // ← Refresh token
    { secret: 'super-refresh-key-2026' }
  );

  // If token is expired or invalid, verify() throws error automatically

  // Step 2: Find user
  const user = await this.prisma.user.findUnique({
    where: { id: payload.sub }
  });

  // Step 3: Create new access token
  const newAccessToken = this.jwtService.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    { secret: 'super-secret-key-2026', expiresIn: '15m' }
  );

  // Step 4: Return new token
  return {
    accessToken: newAccessToken
  };
}
```

**What happens when token expires:**

1. Client sends refresh token
2. Server verifies refresh token (still valid?)
3. Create NEW access token
4. Return new token

---

## 3️⃣ Data Format (DTOs)

**File:** `register.dto.ts`

DTOs validate data coming from user.

```typescript
import { IsString, IsEmail, MinLength, IsEnum } from 'class-validator';

export class RegisterDto {
  @IsEmail() // ← Must be valid email
  email: string;

  @IsString() // ← Must be string
  @MinLength(8) // ← At least 8 characters
  password: string;

  @IsString()
  name: string;

  @IsEnum(['ADMIN', 'DRIVER', 'USER', 'PARAMEDIC']) // ← Only these values
  role: string;
}
```

**What does it do?**

- If user sends `{ email: "invalid", password: "123" }` → Rejected ❌
- Valid data only → Passed ✅

---

**File:** `login.dto.ts`

```typescript
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

---

## 4️⃣ Protecting Routes (Guards)

**File:** `jwt-auth.guard.ts`

Guards are like bouncers at a club. They check if you have a valid ticket (token).

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // This class uses JWT strategy to verify tokens
}
```

**How to use it:**

```typescript
@Get('/profile')
@UseGuards(JwtAuthGuard)  // ← Only let through users with valid token
getProfile() {
  return 'Your profile';
}
```

**What happens:**

1. User sends request without token → Blocked ❌
2. User sends expired token → Blocked ❌
3. User sends valid token → Allowed ✅

---

**File:** `roles.guard.ts`

This checks WHAT ROLE the user is. Admin? Driver? Patient?

```typescript
import { Injectable, ForbiddenException } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required role from decorator
    const roles = this.reflector.get<string[]>('roles', context.getHandler());

    if (!roles) {
      return true; // ← No role requirement, allow
    }

    // Get user from request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user's role is in allowed roles
    if (roles.includes(user.role)) {
      return true; // ← Role matches, allow
    }

    throw new ForbiddenException('Access denied'); // ← Wrong role, block
  }
}
```

**How to use it:**

```typescript
@Delete('/users/:id')
@UseGuards(JwtAuthGuard, RolesGuard)  // ← Check token AND role
@Roles(Role.ADMIN)                     // ← Only ADMIN allowed
deleteUser(@Param('id') id: string) {
  return this.userService.delete(id);
}
```

**What happens:**

1. User without token → Blocked ❌ (JwtAuthGuard fails)
2. User with token but role=DRIVER → Blocked ❌ (RolesGuard fails)
3. User with token and role=ADMIN → Allowed ✅

---

## 5️⃣ Get Current User (Decorator)

**File:** `current-user.decorator.ts`

When you need the logged-in user's info:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // ← User object from JWT token
  },
);
```

**How to use it:**

```typescript
@Get('/profile')
@UseGuards(JwtAuthGuard)
getProfile(@CurrentUser() user: any) {
  return {
    id: user.id,
    email: user.email,
    role: user.role
  };
}
```

**What happens:**

- Automatically extracts logged-in user from token
- No need to pass user ID as parameter

---

## 6️⃣ Token Verification (Strategy)

**File:** `jwt.strategy.ts`

This is how the system knows if a token is valid.

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // ← Get token from header
      ignoreExpiration: false, // ← Reject expired tokens
      secretOrKey: 'super-secret-key-2026', // ← Secret key to verify
    });
  }

  // This runs EVERY TIME a request comes with a token
  validate(payload: any) {
    return {
      id: payload.sub, // ← Extract user ID
      email: payload.email, // ← Extract email
      role: payload.role, // ← Extract role
    };
  }
}
```

**How it works:**

1. Client sends request with header: `Authorization: Bearer eyJ...`
2. `ExtractJwt.fromAuthHeaderAsBearerToken()` → Extracts token from header
3. Verify token using secret key
4. If valid → Call `validate()` → Return user object
5. If invalid → Throw error

---

## 7️⃣ Module Configuration

**File:** `auth.module.ts`

This ties everything together.

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule, // ← Allow Passport strategies
    JwtModule.register({
      // ← JWT configuration
      secret: 'super-secret-key-2026',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController], // ← Export routes
  providers: [AuthService, JwtStrategy], // ← Export services & strategies
  exports: [AuthService], // ← Other modules can use AuthService
})
export class AuthModule {}
```

---

## Complete Flow: User Registers

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ POST /api/auth/register
       │ {
       │   "email": "john@gmail.com",
       │   "password": "MyPassword123",
       │   "name": "John",
       │   "role": "USER"
       │ }
       ↓
┌──────────────────────┐
│  AuthController      │
│  register()          │
└──────┬───────────────┘
       │ Validate data with RegisterDto
       ├─ Email valid? ✅
       ├─ Password ≥ 8 chars? ✅
       ├─ Role in list? ✅
       │
       ↓
┌────────────────────────┐
│  AuthService           │
│  register()            │
└──────┬─────────────────┘
       │ Step 1: Check if email exists in database
       ├─ SELECT * FROM users WHERE email='john@...'
       ├─ Not found ✅
       │
       │ Step 2: Hash password with bcrypt
       ├─ MyPassword123 → $2b$10$... (30 char hash)
       │
       │ Step 3: Save to database
       ├─ INSERT INTO users (email, name, passwordHash, role)
       ├─     VALUES ('john@...', 'John', '$2b$10$...', 'USER')
       │
       │ Step 4: Return success
       ↓
┌──────────────────────┐
│  Browser             │
│  Response:           │
│ {                    │
│  "message": "OK",    │
│  "userId": "abc123"  │
│ }                    │
└──────────────────────┘
```

---

## Complete Flow: User Logs In

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ POST /api/auth/login
       │ {
       │   "email": "john@gmail.com",
       │   "password": "MyPassword123"
       │ }
       ↓
┌──────────────────────┐
│  AuthController      │
│  login()             │
└──────┬───────────────┘
       │ Validate data
       ↓
┌────────────────────────┐
│  AuthService           │
│  login()               │
└──────┬─────────────────┘
       │ Step 1: Find user by email
       ├─ SELECT * FROM users WHERE email='john@...'
       ├─ Found ✅
       │
       │ Step 2: Compare passwords
       ├─ User typed: "MyPassword123"
       ├─ Database has: "$2b$10$..." (hash)
       ├─ bcrypt.compare() → Match? ✅
       │
       │ Step 3: Create access token (15 min)
       ├─ Payload:
       │  {
       │    sub: "user-id-xxx",
       │    email: "john@gmail.com",
       │    role: "USER",
       │    iat: 1234567890,
       │    exp: 1234568890
       │  }
       ├─ Sign with secret → eyJhbGciOiJIUzI1NiIs...
       │
       │ Step 4: Create refresh token (30 days)
       ├─ Similar to access token but longer expiry
       │
       │ Step 5: Return tokens
       ↓
┌──────────────────────┐
│  Browser             │
│  Response:           │
│ {                    │
│  "accessToken":      │
│    "eyJhbGciOi...",  │
│  "refreshToken":     │
│    "eyJhbGciOi...",  │
│  "user": {           │
│    "id": "xxx",      │
│    "email": "...",   │
│    "role": "USER"    │
│  }                   │
│ }                    │
└──────────────────────┘
       │
       │ Browser stores tokens in memory/localStorage
       │
```

---

## Complete Flow: Access Protected Route

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ GET /api/users/123
       │ Header: Authorization: Bearer eyJhbGciOi...
       ↓
┌────────────────────────┐
│  JwtAuthGuard          │
│  (bouncer checks)      │
└──────┬─────────────────┘
       │ Step 1: Extract token from header
       ├─ Get "eyJhbGciOi..." from Bearer header
       │
       │ Step 2: Verify token
       ├─ Decode with secret → $2b$10$...
       ├─ Check expiry: expires in 2 min ✅
       │
       │ Step 3: Call JwtStrategy.validate()
       ├─ Extract payload:
       │  {
       │    sub: "user-id-xxx",
       │    email: "john@gmail.com",
       │    role: "USER"
       │  }
       │
       │ Step 4: Attach to request.user
       ├─ request.user = { id: "xxx", email: "...", role: "USER" }
       │
       │ Step 5: Allow request to proceed ✅
       ↓
┌────────────────────────┐
│  RolesGuard            │
│  (role checker)        │
└──────┬─────────────────┘
       │ Step 1: Check required role
       ├─ Decorator says: @Roles(Role.ADMIN)
       │
       │ Step 2: Check user role
       ├─ request.user.role = "USER"
       │ Required: "ADMIN"
       │ Match? ❌ NO
       │
       │ Step 3: Block request
       ↓
┌──────────────────────┐
│  Browser             │
│  Error Response:     │
│ {                    │
│  "statusCode": 403,  │
│  "message":          │
│   "Access denied"    │
│ }                    │
└──────────────────────┘
```

---

## Summary: What Auth Module Does

| Action         | Route                          | What Happens                |
| -------------- | ------------------------------ | --------------------------- |
| Register       | `POST /api/auth/register`      | Create new account          |
| Login          | `POST /api/auth/login`         | Get access + refresh tokens |
| Refresh        | `POST /api/auth/refresh-token` | Get new access token        |
| Protect Routes | `@UseGuards(JwtAuthGuard)`     | Only logged-in users        |
| Role Check     | `@Roles(Role.ADMIN)`           | Only specific roles         |
| Get User       | `@CurrentUser()`               | Get logged-in user info     |

---

## Key Concepts

### 1. **Password Hashing**

- Never store plain passwords!
- `bcrypt` converts `MyPassword123` → `$2b$10$...` (irreversible)
- To check: `bcrypt.compare("MyPassword123", "$2b$10$...")` → true/false

### 2. **JWT Token**

- Token = Digital Passport
- Contains: user ID, email, role, expiry
- Signed with secret key (can't fake without secret)
- Expires after X minutes

### 3. **Access vs Refresh Token**

- **Access Token** = Short-lived (15 min) → Use for API calls
- **Refresh Token** = Long-lived (30 days) → Use to get new access token

### 4. **Guards**

- `JwtAuthGuard` = Check if token exists & valid
- `RolesGuard` = Check if user has right role

### 5. **DTOs** (Data Transfer Objects)

- Validate incoming data
- Ensure only correct format accepted

---

## Test It Yourself

### Register

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gmail.com",
    "password": "TestPassword123",
    "name": "Test User",
    "role": "USER"
  }'
```

**Response:**

```json
{
  "message": "User registered successfully",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gmail.com",
    "password": "TestPassword123"
  }'
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "test@gmail.com",
    "role": "USER"
  }
}
```

---

### Use Token to Access Protected Route

```bash
curl -X GET http://localhost:3001/api/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "test@gmail.com",
  "name": "Test User",
  "role": "USER",
  "verified": false,
  "createdAt": "2026-03-08T10:30:00Z"
}
```

---

**Now you understand the AUTH module!** 🎉

When you see other modules, they all work similarly:

- Controller (routes)
- Service (logic)
- DTOs (validation)
- Guards (protection)

---

## Next Steps

1. ✅ Understand AUTH module (you just did!)
2. Look at `src/modules/ride-requests/` (similar structure)
3. Look at `src/modules/dispatch/` (uses AUTH + RideRequests)
4. Look at `src/modules/tracking/` (WebSocket + AUTH)
