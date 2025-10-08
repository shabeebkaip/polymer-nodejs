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
