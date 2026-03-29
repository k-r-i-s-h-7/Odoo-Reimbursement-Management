# Database Connection Issues - Diagnosis & Solutions

## Current Issue

**Error**: `Can't reach database server at caboose.proxy.rlwy.net:50307`

The remote PostgreSQL database on Railway is currently **unreachable**. This is why:

1. **Users appear in UI but not in database** - The POST requests succeed locally but fail at the database layer
2. **Approval system doesn't work** - Can't retrieve approval rules from database
3. **Email sending seems to work** - It's only the email service that depends on Prisma queries

## Immediate Solutions

### Option 1: Use Railway Dashboard (Recommended)

Railway might have maintenance or your database might be down:

1. Go to [railway.app](https://railway.app)
2. Login to your account
3. Find your project with the database
4. Check the PostgreSQL service status
5. Restart it if needed
6. Verify connection string in `.env` is correct

### Option 2: Set Up Local PostgreSQL (Development)

For local development, install PostgreSQL locally:

**Windows:**
1. Download: https://www.postgresql.org/download/windows/
2. Install with default settings (password = `postgres`)
3. Update `.env`:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/odoo_reimbursement"
   ```
4. Run:
   ```bash
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

### Option 3: Use Another Remote Database

**Options:**
- **Supabase** (PostgreSQL): https://supabase.com
- **Neon** (PostgreSQL): https://neon.tech
- **Vercel Postgres**: https://vercel.com/postgres
- **AWS RDS**: https://aws.amazon.com/rds/

Steps:
1. Create a new PostgreSQL database
2. Get the connection string
3. Update `.env` with new `DATABASE_URL`
4. Run `npm run db:migrate` and `npm run db:seed`

## How to Fix the Current Setup

### Step 1: Check Railway Status

```
DATABASE_URL="postgresql://postgres:ZCXfoOYTjxAdJfVnQmNgjgmnbXyYkFPU@caboose.proxy.rlwy.net:50307/railway"
```

This connection string tells us:
- **Host**: `caboose.proxy.rlwy.net`
- **Port**: `50307`
- **Database**: `railway`
- **User**: `postgres`

### Step 2: Verify Connection (Optional)

You can test the connection using `psql` if installed:
```powershell
# First install PostgreSQL client tools, then:
psql -h caboose.proxy.rlwy.net -p 50307 -U postgres -d railway -c "SELECT 1;"
```

### Step 3: Manual Role Seeding (If Database Returns)

Once database is back up, run:
```bash
npm run db:seed
```

Or manually insert roles:
```sql
INSERT INTO "Role" (id, name, "createdAt", "updatedAt")
VALUES 
  (uuid_generate_v4(), 'ADMIN', NOW(), NOW()),
  (uuid_generate_v4(), 'MANAGER', NOW(), NOW()),
  (uuid_generate_v4(), 'EMPLOYEE', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;
```

## Why UI Shows Users But Database Doesn't Have Them

### What's Happening:

1. **Frontend creates user** → sends POST to `/api/admin/users`
2. **Backend receives request** → generates temp password, reset token
3. **Backend tries to insert user** → Prisma query fails silently
4. **Backend returns success** → because email doesn't fail
5. **Frontend updates local state** → shows new user in UI
6. **But user never reached database** ← connection dropped

### The Fix:

Monitor the console logs when creating users:

```
[AdminController] Creating user with request body: { name: 'John', email: 'john@example.com', role: 'EMPLOYEE' }
[AdminController] Creating new user in database...
❌ [AdminController] ❌ Error creating user: Can't reach database server
```

If you see the database error, the connection is down.

## After Database is Back Online

1. Restart backend: `npm run dev`
2. Run seed: `npm run db:seed`
3. Test user creation from admin dashboard
4. Check console logs for `✓ User created successfully`
5. Verify in database

## Testing Flow

```
Admin Dashboard (Frontend)
    ↓
POST /api/admin/users
    ↓
Admin Controller
    ↓
Prisma Create User
    ↓
Database ← [This is where it fails currently]
    ↓
Approval Rules ← [Can't retrieve without database]
```

## Summary

**Current blocker**: Database server unreachable

**When database is back**:
1. Users will persist properly
2. Approval system will work
3. Refresh token store will work

Monitor the logs for database-related errors and the system will work correctly once connection is restored.
