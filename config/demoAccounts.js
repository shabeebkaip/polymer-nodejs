// Demo/Test accounts that bypass OTP verification
// These accounts were created before OTP implementation

export const demoAccounts = {
  emails: [
    'alice@innovatech.com',
    'bob@buildcorp.com',
    'john.doe@agrolife.com'
  ],
  
  ids: [
    '6818aa54ff902dbc43f9881f',
    '6818b5e1571c9558d3d76358',
    '681b35f4faa74052866fa782'
  ]
};

// Check if an email is a demo account
export const isDemoAccount = (email) => {
  return demoAccounts.emails.includes(email?.toLowerCase());
};

// Check if a user ID is a demo account
export const isDemoAccountById = (userId) => {
  return demoAccounts.ids.includes(userId?.toString());
};

export default {
  demoAccounts,
  isDemoAccount,
  isDemoAccountById
};
