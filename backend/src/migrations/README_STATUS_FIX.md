# Status Constraint Fix

## Problem
The database constraint `status_format_check` on the `leads` table was outdated and didn't include all status values used in the frontend application. This caused errors when trying to archive leads or use certain status values.

### Error Message
```
new row for relation "leads" violates check constraint "status_format_check"
```

## Root Cause
The database constraint only allowed these statuses:
- enquiry, prospect, enrollment, trainingprogress, handsonproject, certification, cvbuild, mockinterviews, liveinterviews, placement, onhold, archived

But the frontend also uses:
- **placementdue**, **placementpaid**, **finishers**

This mismatch caused validation errors when these statuses were used.

## Solution
This migration updates the constraint to include all valid statuses used in the application.

### Updated Status List
- enquiry
- prospect
- enrollment
- trainingprogress
- handsonproject
- certification
- cvbuild
- mockinterviews
- liveinterviews
- placement
- **placementdue** *(added)*
- **placementpaid** *(added)*
- **finishers** *(added)*
- onhold
- archived

## How to Apply the Fix

### Option 1: Double-click the batch file (Easiest)
1. Navigate to: `backend/src/migrations/`
2. Double-click `APPLY_FIX.bat`
3. Follow the prompts

### Option 2: Run PowerShell script
```powershell
cd backend/src/migrations
.\run_fix_status_constraint.ps1
```

### Option 3: Manual SQL execution
If you have `psql` in your PATH:
```bash
psql -U postgres -d zen_live -f backend/src/migrations/fix_status_constraint.sql
```

Or using any PostgreSQL client (pgAdmin, DBeaver, etc.):
1. Open `fix_status_constraint.sql`
2. Execute it against your `zen_live` database

## Files Updated

### Database Migration
- ✅ `fix_status_constraint.sql` - Updates database constraint

### Backend Controllers
- ✅ `archiveController.js` - Updated allowed statuses in restoreLead()
- ✅ `bulkUploadController.js` - Updated allowed statuses for bulk uploads

### Frontend
- ℹ️ No changes needed - already using correct statuses

## Verification
After applying the migration, you can verify it worked by:

1. Checking the constraint:
```sql
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'status_format_check';
```

2. Testing archive functionality:
   - Try archiving a lead from the frontend
   - Should complete without errors

## Rollback (if needed)
If you need to revert this change:
```sql
ALTER TABLE leads DROP CONSTRAINT IF EXISTS status_format_check;
ALTER TABLE leads ADD CONSTRAINT status_format_check CHECK (
  status IN ('enquiry', 'prospect', 'enrollment', 'trainingprogress', 
             'handsonproject', 'certification', 'cvbuild', 'mockinterviews', 
             'liveinterviews', 'placement', 'onhold', 'archived')
);
```

## Support
If you encounter any issues:
1. Check that PostgreSQL is running
2. Verify your database credentials
3. Ensure you have ALTER TABLE permissions
4. Check the error logs in the terminal/console

