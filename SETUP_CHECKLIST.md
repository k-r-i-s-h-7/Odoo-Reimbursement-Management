# Setup & Testing Checklist

## Backend Status
- ✅ Backend running on port 5000
- ✅ Database connection verified
- ✅ Enhanced logging enabled
- ⏳ Roles need to be seeded

## Immediate Action Items

### 1. Seed Database Roles (REQUIRED)
Run this command:
```bash
npm run db:seed
```

Expected output:
```
🌱  Seeding roles...
   ✓  Role "ADMIN" ready
   ✓  Role "MANAGER" ready
   ✓  Role "EMPLOYEE" ready
✅  Seed complete
```

### 2. Configure SMTP for Email (OPTIONAL but Recommended)
Edit `Backend/.env` and update:
```
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

To get Gmail app password:
1. Go to https://myaccount.google.com/apppasswords
2. Select Mail and Windows Computer
3. Copy the 16-character password to `SMTP_PASS`

### 3. Test User Creation (ADMIN DASHBOARD)
1. Start frontend if not running: `npm run dev` (in Frontend folder)
2. Login to admin dashboard
3. Create a new employee/manager
4. **Watch backend console** for success logs

### 4. Test in Database (OPTIONAL)
Connect to PostgreSQL database and run:
```sql
SELECT COUNT(*) FROM "User" WHERE "companyId" = 'your-company-id';
```
Should show the users you created.

## Testing Checklist

### Test 1: User Creation Persistence
- [ ] Create user in admin dashboard
- [ ] Check backend logs show: `✓ User created successfully`
- [ ] Verify user appears in admin users list
- [ ] User receives welcome email (if SMTP configured)

### Test 2: Approval Workflow
- [ ] Login as employee
- [ ] Create an expense
- [ ] Submit for approval
- [ ] Check backend logs show: `[ApprovalService] Initiating workflow`

### Test 3: Manager/Approver Flow
- [ ] Login as manager
- [ ] Should see pending approvals
- [ ] Approve or reject an expense
- [ ] Employee receives decision email (if SMTP configured)

### Test 4: Email Delivery
- [ ] Create new employee (triggers welcome email)
- [ ] Check backend logs for email status
- [ ] Should receive email in inbox (or check Gmail spam folder)

## Debugging Commands

### Monitor Backend Logs in Real-Time
```bash
# Terminal 1: Run backend
cd Backend
npm run dev
```
Keep this running and watch for log messages

### Check Database Connection
Backend will show on startup:
```
[Prisma] ✓ Database connection successful
```

### Verify Roles Exist
```bash
# After seeding, query database to verify
npm run db:seed
```

### View All Users in Database
```sql
SELECT u.id, u.name, u.email, r.name as role, u."createdAt"
FROM "User" u
JOIN "Role" r ON u."roleId" = r.id
ORDER BY u."createdAt" DESC
LIMIT 10;
```

## Common Issues & Solutions

### Issue: "Role not found" error
**Solution**: Run `npm run db:seed`

### Issue: Database connection fails
**Solution**: 
1. Check Railway dashboard at https://railway.app
2. Verify `DATABASE_URL` in `.env` is correct
3. Restart backend: `npm run dev`

### Issue: Email not sending
**Solution**:
1. Check `[EmailService]` logs for errors
2. Verify SMTP credentials in `.env`
3. Check if SMTP_USER and SMTP_PASS are set (not placeholders)

### Issue: Users created but don't appear in database
**Solution**:
1. Check backend logs for errors
2. Verify database connection shows: `✓ Database connection successful`
3. Check role exists in database: `SELECT * FROM "Role"`

## Log Entry Examples

### Successful User Creation:
```
[AdminController] Creating user with request body: { name: 'Jane Doe', email: 'jane@company.com', role: 'MANAGER' }
[AdminController] Role record found: { id: '1234-abcd...', name: 'MANAGER' }
[AdminController] Creating new user in database...
[AdminController] ✓ User created successfully: { id: 'user-id-1...', email: 'jane@company.com', role: 'MANAGER' }
[EmailService] Sending welcome email to jane@company.com...
[EmailService] Welcome email sent successfully to jane@company.com
```

### Successful Approval Workflow:
```
[ApprovalService] Initiating workflow for expense: { id: 'exp-123...', employeeId: 'emp-456...' }
[ApprovalService] Employee found: { id: 'emp-456...', name: 'John Doe' }
[ApprovalService] Rule found: { id: 'rule-789...', description: 'Standard 2-level approval' }
```

## Performance Notes

- Database connection verified on startup
- Prisma queries logged in development mode
- Email sending is non-blocking (doesn't fail user creation if email fails)
- Approval workflow is async

## Support Resources

1. **Database Issues**: https://railway.app (check project status)
2. **SMTP/Gmail**: https://myaccount.google.com/apppasswords
3. **Prisma Docs**: https://www.prisma.io/docs
4. **Express Docs**: https://expressjs.com

## Next Steps

1. ✅ Backend is running
2. ▶️ **Run `npm run db:seed`** to create roles
3. ▶️ Create users from admin dashboard
4. ▶️ Test approval workflow
5. ▶️ Configure SMTP if needed (for email)

After completing these steps, your approval system and user management should work correctly!
