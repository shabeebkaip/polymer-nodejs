import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.js';

dotenv.config();

// Demo user emails that should bypass OTP verification
const demoUserEmails = [
  'alice@innovatech.com',
  'bob@buildcorp.com'
];

// Alternative: Use user IDs if you prefer
const demoUserIds = [
  '6818aa54ff902dbc43f9881f',
  '6818b5e1571c9558d3d76358',
  '681b35f4faa74052866fa782'
];

const bypassOTPForDemoUsers = async () => {
  try {
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGO);
    console.log('✅ Database connected\n');

    // Method 1: Update by email
    console.log('📧 Updating users by email...');
    const emailResult = await User.updateMany(
      { email: { $in: demoUserEmails } },
      { 
        $set: { 
          emailVerified: true,
          verification: 'verified'
        } 
      }
    );
    console.log(`✅ Updated ${emailResult.modifiedCount} users by email\n`);

    // Method 2: Update by ID
    console.log('🆔 Updating users by ID...');
    const idResult = await User.updateMany(
      { _id: { $in: demoUserIds.map(id => new mongoose.Types.ObjectId(id)) } },
      { 
        $set: { 
          emailVerified: true,
          verification: 'verified'
        } 
      }
    );
    console.log(`✅ Updated ${idResult.modifiedCount} users by ID\n`);

    // Verify the updates
    console.log('🔍 Verifying updated users:');
    const updatedUsers = await User.find({
      $or: [
        { email: { $in: demoUserEmails } },
        { _id: { $in: demoUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
      ]
    }).select('firstName lastName email emailVerified verification');

    updatedUsers.forEach(user => {
      console.log(`  ✓ ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`    - Email Verified: ${user.emailVerified}`);
      console.log(`    - Verification Status: ${user.verification}\n`);
    });

    console.log('✅ Demo users are now verified and can log in without OTP!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the script
bypassOTPForDemoUsers();
