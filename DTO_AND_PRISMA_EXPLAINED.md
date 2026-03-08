# DTO & Prisma Generate - Explained Simply

---

## 1️⃣ What is DTO? Why Do We Need It?

### DTO = Data Transfer Object

**It's a validation form for incoming data.**

Think of it like a hotel check-in form:

```
Hotel Check-in Form (DTO)
┌─────────────────────────────────┐
│ Name: [required, text only]     │
│ Email: [required, valid email]  │
│ Phone: [required, 10+ digits]   │
│ Age: [required, 18 or older]    │
└─────────────────────────────────┘

What happens:
✅ All fields filled correctly? → Accept
❌ Missing fields? → Reject "Name is required"
❌ Invalid email? → Reject "Email is not valid"
❌ Age is 5? → Reject "Must be 18+"
```

---

## Why DTOs Exist (Real Example)

### Without DTO

```typescript
@Post('/register')
register(@Body() body: any) {  // ← Accepts ANYTHING
  // User sends:
  // {
  //   "email": "test@gmail.com",
  //   "password": "123",
  //   "xyz": "garbage data",
  //   "hacker": "true"
  // }

  // No validation! Accepts everything.
  // Hacker can send garbage and mess up database.
}
```

**Problems:**

- ❌ Accepts garbage data
- ❌ No validation
- ❌ Security risk
- ❌ Random fields stored in database

### With DTO

```typescript
export class RegisterDto {
  @IsEmail()              // ← Must be valid email
  email: string;

  @IsString()
  @MinLength(8)           // ← At least 8 characters
  password: string;

  @IsString()
  name: string;

  @IsEnum(['ADMIN', 'DRIVER', 'USER'])  // ← Only these values
  role: string;
}

@Post('/register')
register(@Body() dto: RegisterDto) {  // ← Validate first
  // If data is invalid, request is automatically rejected
  // If valid, then process it
}
```

**Benefits:**

- ✅ Only accepts correct data format
- ✅ Automatic validation
- ✅ Security: rejects bad requests
- ✅ Clear error messages
- ✅ Type-safe (TypeScript knows what fields exist)

---

## Real Example: Login DTO

**File:** `src/modules/auth/dto/login.dto.ts`

```typescript
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail() // ← Decorator: email must be valid
  email: string;

  @IsString() // ← Decorator: must be string
  password: string;
}
```

### Valid Request ✅

```json
POST /api/auth/login
{
  "email": "john@gmail.com",
  "password": "MyPassword123"
}
```

Response: ✅ Accepted, proceed to login logic

---

### Invalid Request ❌ (Not an Email)

```json
POST /api/auth/login
{
  "email": "not-an-email",
  "password": "MyPassword123"
}
```

Response: ❌ Error

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "email must be an email"
    }
  ]
}
```

---

### Invalid Request ❌ (Missing Field)

```json
POST /api/auth/login
{
  "email": "john@gmail.com"
}
```

Response: ❌ Error

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "password",
      "message": "password must be a string"
    }
  ]
}
```

---

## Common DTO Decorators

```typescript
@IsEmail()              // Must be valid email
@IsString()             // Must be string
@IsNumber()             // Must be number
@IsBoolean()            // Must be true/false
@IsUUID()               // Must be UUID format
@MinLength(8)           // Minimum 8 characters
@MaxLength(100)         // Maximum 100 characters
@Min(18)                // Number ≥ 18
@Max(100)               // Number ≤ 100
@IsEnum(['A', 'B'])     // Must be A or B
@IsOptional()           // Field is not required
@Matches(/^[0-9]+$/)    // Regex pattern
```

---

## Why Prisma Generate?

### What is Prisma?

Prisma is an **ORM** (Object Relational Mapper). It's a tool that:

- Reads your database schema
- Generates TypeScript code to query database
- Prevents SQL injection
- Provides type safety

---

## Prisma Generate Explained

### Step 1: You Define Schema

**File:** `prisma/schema.prisma`

```prisma
model User {
  id       String  @id @default(uuid())
  email    String  @unique
  name     String
  password String
}
```

This says: "My database has a User table with fields: id, email, name, password"

---

### Step 2: You Run `npx prisma generate`

This command:

```bash
npx prisma generate
```

**What it does:**

1. Reads `prisma/schema.prisma`
2. Generates TypeScript code in `node_modules/@prisma/client`
3. Creates type definitions for your models

**Files created:**

```
node_modules/@prisma/client/
├── index.d.ts          ← TypeScript types
├── runtime/            ← Runtime code
├── generated/
│   └── prisma.d.ts     ← Type definitions
└── ...
```

---

### Step 3: You Use Prisma in Your Code

Now you can write queries like:

```typescript
// Type-safe! TypeScript knows User has: id, email, name, password
const user = await this.prisma.user.findUnique({
  where: { id: '123' },
});

console.log(user.email); // ✅ TypeScript knows this exists
console.log(user.xyz); // ❌ TypeScript error: xyz doesn't exist
```

---

## Why Must You Run Prisma Generate FIRST?

### Scenario 1: You Skip Prisma Generate

```bash
npm install
# ❌ Skip prisma generate
npm run start:dev
```

**Error:**

```
Cannot find module '@prisma/client'
```

**Why?** The client code doesn't exist yet!

---

### Scenario 2: You Run Prisma Generate

```bash
npm install
npx prisma generate  ← ✅ Generate client code
npm run start:dev
```

**No error!** Code exists.

---

## Complete Setup Order

```
1. npm install
   └─ Installs all packages including prisma

2. npx prisma generate
   └─ Generates Prisma client code
   └─ WITHOUT this, @prisma/client doesn't exist

3. npx prisma migrate deploy
   └─ Creates database tables based on schema.prisma

4. npm run seed (optional)
   └─ Fills database with test data

5. npm run start:dev
   └─ Starts the server
```

### Why this order?

```
prisma generate BEFORE start:dev
         ↓
If you don't generate first, when app starts:
  import { PrismaClient } from '@prisma/client'
       ↓
'@prisma/client' doesn't exist
       ↓
App crashes
```

---

## Visual: How Database Schema Works

### Your Schema

```prisma
model User {
  id       String  @id @default(uuid())
  email    String  @unique
  name     String
  password String
}
```

↓ `npx prisma generate`

### Generated TypeScript Code

```typescript
// @prisma/client automatically creates:

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
}

export class PrismaClient {
  user: {
    findUnique(where: { id: string }): Promise<User>;
    create(data: Omit<User, 'id'>): Promise<User>;
    update(data: User): Promise<User>;
    delete(where: { id: string }): Promise<User>;
    findMany(): Promise<User[]>;
  };
}
```

↓ Now you can use it

### Your Code

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// TypeScript knows User type exists
const user: User = await prisma.user.findUnique({
  where: { id: '123' },
});
```

---

## Real Example: Complete Flow

### 1. Define Schema

**prisma/schema.prisma**

```prisma
model User {
  id    String  @id @default(uuid())
  email String  @unique
  name  String
}
```

### 2. Generate Client

```bash
npx prisma generate
```

Now `@prisma/client` exists with User types.

### 3. Define DTO

**src/modules/users/dto/create-user.dto.ts**

```typescript
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;
}
```

### 4. Create Service

**src/modules/users/users.service.ts**

```typescript
import { PrismaClient, User } from '@prisma/client'; // ← Types from prisma generate

export class UsersService {
  constructor(private prisma: PrismaClient) {}

  // DTO validates input, Prisma saves to database
  async create(dto: CreateUserDto): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
      },
    });
  }

  async findById(id: string): Promise<User> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}
```

### 5. Complete Request Flow

```
POST /api/users
{
  "email": "john@gmail.com",
  "name": "John"
}

         ↓ DTO Validation (CreateUserDto)
         ✅ Valid email? YES
         ✅ Name is string? YES
         ↓
    UsersService.create()
         ↓ Prisma Query
    INSERT INTO users (email, name)
    VALUES ('john@gmail.com', 'John')
         ↓ Database
    ✅ User created
         ↓
Response:
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@gmail.com",
  "name": "John"
}
```

---

## Does Prisma Generate Create Database?

**No!** It only generates code.

```
npx prisma generate
   └─ Creates TypeScript client code
   └─ Does NOT create database tables
   └─ Does NOT connect to database

npx prisma migrate deploy
   └─ ACTUALLY creates tables in database
   └─ Reads schema.prisma
   └─ Executes SQL to create User, Ambulance, etc. tables
```

---

## Commands Summary

```bash
# Generates client code (required before running app)
# Does NOT touch database
npx prisma generate

# Creates tables in your existing database
# Reads migrations folder
npx prisma migrate deploy

# Shows database in browser UI
npx prisma studio

# Creates new migration file (when you change schema.prisma)
npx prisma migrate dev --name add_new_field

# DANGEROUS: Deletes all data and recreates database
npx prisma migrate reset
```

---

## Key Takeaways

### DTO (Data Transfer Object)

```
✅ Validates incoming request data
✅ Rejects bad data automatically
✅ Type-safe in TypeScript
✅ Security: prevents garbage data
✅ Clear error messages
```

### Prisma Generate

```
✅ Generates TypeScript client code
✅ Makes @prisma/client available
✅ Provides type safety for database queries
✅ MUST run before npm start
✅ Does NOT create database (that's migrate deploy)
```

### Order

```
1. npm install
2. npx prisma generate   ← Generate client
3. npx prisma migrate deploy  ← Create tables
4. npm run seed          ← Add test data
5. npm run start:dev     ← Run app
```
