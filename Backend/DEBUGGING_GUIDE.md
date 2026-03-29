# Backend Debugging Guide

## What Changed

Enhanced logging has been added throughout the system to help diagnose issues with:
1. User creation (admin dashboard)
2. Approval workflow initialization
3. Email sending

## How to Test

### Step 1: Check Database Roles are Seeded

Open your database admin tool or run this to verify roles exist:
```sql
SELECT * FROM "Role";
```

You should see: `ADMIN`, `MANAGER`, `EMPLOYEE`

### Step 2: Create a User via Admin Dashboard

When you create an employee/manager:

**Watch the Backend Console for Logs Like:**

```
[AdminController] Creating user with request body: { name: '...', email: '...', role: 'EMPLOYEE' }
[AdminController] Role record found: { id: '...', name: 'EMPLOYEE' }
[AdminController] Creating new user in database...
[AdminController] ✓ User created successfully: { id: '...', email: '...', role: 'EMPLOYEE' }
[AdminController] Sending response with new user data
[EmailService] Sending welcome email to user@example.com...
```

### Step 3: Verify User in Database

Query the database to confirm user was created:
```sql
SELECT id, name, email, "roleId", "companyId", "createdAt" FROM "User" WHERE email = 'newuser@example.com';
```

### Step 4: List Users via API

The admin dashboard list users endpoint should show the new user:
- **Endpoint**: `GET /api/admin/users`
- **Backend Log**: `[AdminController] Listing users for company: [companyId]`
- **Expected**: User appears in the response

### Step 5: Create an Expense & Submit for Approval

When submitting an expense:

**Watch for Approval Logs:**
```
[ApprovalService] Initiating workflow for expense: { id: '...', employeeId: '...' }
[ApprovalService] Employee found: { id: '...', name: '...' }
[ApprovalService] Rule found: { id: '...', description: '...' }
```

Or if no rule is configured:
```
[ApprovalService] ℹ️ No approval rule configured for employee, auto-approving expense
```

## Troubleshooting Checklist

### Users Not Appearing After Creation:

1. ✅ Check backend logs show `✓ User created successfully`
2. ✅ Query database directly: `SELECT COUNT(*) FROM "User" WHERE email = '...';`
3. ✅ Verify `companyId` matches current admin's company
4. ✅ Check for errors in database connection logs

### Email Not Sending:

1. ✅ Check `.env` has SMTP credentials set (not placeholders)
2. ✅ Watch for `[EmailService] SMTP connection verified ✓`
3. ✅ Look for error logs: `[EmailService] Failed to send...`
4. ✅ Verify `SMTP_USER` and `SMTP_PASS` are correct

### Approval Workflow Issues:

1. ✅ Verify approval rule exists for the employee
2. ✅ Check `[ApprovalService]` logs when submitting expense
3. ✅ Confirm approvers are in the same company

## Log Levels

- ✓ = Success
- ⚠️ = Warning
- ❌ = Error
- ℹ️ = Info

## Database Queries for Verification

Check created users:
```sql
SELECT u.id, u.name, u.email, r.name as role, u."companyId", u."createdAt"
FROM "User" u
JOIN "Role" r ON u."roleId" = r.id
WHERE u."companyId" = 'your-company-id'
ORDER BY u."createdAt" DESC;
```

Check approval rules:
```sql
SELECT ar.id, ar.description, tu.name as target_employee, ar."isSequential"
FROM "ApprovalRule" ar
JOIN "User" tu ON ar."targetUserId" = tu.id
WHERE ar."companyId" = 'your-company-id';
```

Check pending approvals:
```sql
SELECT ar.id, ar."expenseId", ar.status, e.description
FROM "ApprovalRequest" ar
JOIN "Expense" e ON ar."expenseId" = e.id
WHERE ar.status = 'PENDING'
ORDER BY ar."createdAt" DESC;
```
