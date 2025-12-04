# Database Scripts

This folder contains utility scripts for database management and maintenance.

## Available Scripts

### bypass-otp-demo-users.js
Marks demo users as verified, bypassing OTP verification requirement.

**Usage:**
```bash
node scripts/bypass-otp-demo-users.js
```

**What it does:**
- Updates specified demo users in the database
- Sets `emailVerified: true`
- Sets `verification: 'verified'`
- Allows immediate login without OTP verification

**Demo Users Configured:**
- alice@innovatech.com
- bob@buildcorp.com
- john.doe@agrolife.com

---

### delete-all-quote-requests.js
Deletes all product quote requests and their associated comments from the database.

**Usage:**
```bash
node scripts/delete-all-quote-requests.js
```

**What it does:**
- Shows current statistics (quote requests & comments count)
- Waits 3 seconds for confirmation (Ctrl+C to cancel)
- Deletes all quote comments first
- Deletes all quote requests
- Shows final statistics

**Use Cases:**
- Clean up test data
- Reset database for fresh testing
- Development environment cleanup

⚠️ **Warning:** This permanently deletes all quote requests and comments!

---

### delete-quote-requests-advanced.js
Advanced deletion script with filtering options for selective deletion.

**Usage:**
```bash
# Delete all quote requests
node scripts/delete-quote-requests-advanced.js --all

# Delete by status
node scripts/delete-quote-requests-advanced.js --status=pending
node scripts/delete-quote-requests-advanced.js --status=cancelled

# Delete by user
node scripts/delete-quote-requests-advanced.js --buyer=<buyerId>
node scripts/delete-quote-requests-advanced.js --seller=<sellerId>

# Delete by product
node scripts/delete-quote-requests-advanced.js --product=<productId>

# Delete by date range
node scripts/delete-quote-requests-advanced.js --before=2024-01-01
node scripts/delete-quote-requests-advanced.js --after=2024-01-01

# Combine multiple filters
node scripts/delete-quote-requests-advanced.js --status=cancelled --before=2024-01-01

# Skip confirmation prompt
node scripts/delete-quote-requests-advanced.js --all --force

# Show help
node scripts/delete-quote-requests-advanced.js --help
```

**Options:**
- `--all` - Delete all quote requests
- `--status=<status>` - Filter by status (pending, responded, accepted, rejected, cancelled)
- `--buyer=<buyerId>` - Filter by buyer ID
- `--seller=<sellerId>` - Filter by seller ID
- `--product=<productId>` - Filter by product ID
- `--before=<date>` - Filter created before date (YYYY-MM-DD)
- `--after=<date>` - Filter created after date (YYYY-MM-DD)
- `--force` - Skip confirmation prompt
- `--help` - Show help message

**What it does:**
- Validates filter options
- Shows query summary and count
- Displays preview of first 10 records to be deleted
- Waits for confirmation (unless --force is used)
- Deletes associated comments
- Deletes matching quote requests
- Shows final statistics

**Examples:**
```bash
# Clean up all old cancelled requests
node scripts/delete-quote-requests-advanced.js --status=cancelled --before=2024-06-01

# Delete all requests for a specific product
node scripts/delete-quote-requests-advanced.js --product=507f1f77bcf86cd799439011

# Delete all pending requests from a specific buyer
node scripts/delete-quote-requests-advanced.js --status=pending --buyer=507f1f77bcf86cd799439012
```

⚠️ **Warning:** Deletions are permanent and cannot be undone!

## Adding More Demo Users

Edit `config/demoUsers.js` to add more emails to the demo user list:

```javascript
export const demoUsers = [
  'alice@innovatech.com',
  'bob@buildcorp.com',
  'newdemo@example.com'  // Add here
];
```

## Notes

- Demo users are automatically verified on login
- No need to run the script multiple times
- Demo users will bypass OTP verification permanently
- Safe to use in development and staging environments
