# ⚡ QUICK START - Get Running in 10 Minutes

**For absolute beginners. Only essentials. No theory.**

---

## Step 1: Install What You Need (One Time Only)

Download and install these:

1. **Node.js** → https://nodejs.org (LTS version)
2. **Docker Desktop** → https://docker.com/products/docker-desktop
3. **Git** → https://git-scm.com

After installing, restart your computer.

---

## Step 2: Get the Project

Open your terminal/command prompt and run:

```bash
git clone git@bitbucket.org:abdulshakoor1/resqlink-backend.git
cd resqlink-backend
```

---

## Step 3: Install Dependencies

```bash
npm install
```

Wait for it to finish (2-3 minutes).

---

## Step 4: Create `.env` File

Create a new file named `.env` in the project folder with this content:

```env
DATABASE_URL="postgresql://resqlink:resqlink@localhost:5433/resqlink_db?schema=public"
JWT_ACCESS_SECRET="super-secret-key-2026"
JWT_REFRESH_SECRET="super-refresh-key-2026"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="30d"
PORT=3001
```

**Save it.** ✅

---

## Step 5: Start Database (Docker)

```bash
docker-compose up -d
```

Check if containers started:

```bash
docker ps
```

You should see two containers: `postgres` and `redis`.

---

## Step 6: Setup Database

```bash
npx prisma generate
```

Then:

```bash
npx prisma migrate deploy
```

This creates all database tables automatically. ✅

---

## Step 7: Add Test Data (Optional)

```bash
npm run seed
```

This adds fake users and data for testing.

**Test Accounts:**

```
Admin: admin@resqlink.com / Admin@1234
Patient: patient@resqlink.com / Patient@1234
Driver: driver@resqlink.com / Driver@1234
```

---

## Step 8: Run the Project

```bash
npm run start:dev
```

Wait for message: `Server listening on port 3001`

---

## ✅ Done! Test It

**In your browser, go to:**

```
http://localhost:3001/api/docs
```

You'll see all API endpoints. Try them! 🎉

---

## 🛑 Troubleshooting

**Error: "Port 3001 already in use"**

```bash
# Change port in .env
PORT=3002
```

**Error: "Docker not running"**
→ Open Docker Desktop

**Error: "Cannot connect to database"**

```bash
docker-compose down
docker-compose up -d
```

**Error: Something fails**

```bash
# Try this:
npm install
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

---

**Next:** Read `AUTH_MODULE_EXPLAINED.md` to understand how one module works.
