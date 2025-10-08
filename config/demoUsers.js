// Demo user configuration
// These users will automatically bypass OTP verification
// Created before OTP implementation was added

export const demoUsers = [
  'alice@innovatech.com',
  'bob@buildcorp.com',
  'john.doe@agrolife.com'
];

export const isDemoUser = (email) => {
  return demoUsers.includes(email?.toLowerCase());
};

export const getDemoUserConfig = () => {
  return {
    users: demoUsers,
    bypassOTP: true,
    autoVerify: true
  };
};
