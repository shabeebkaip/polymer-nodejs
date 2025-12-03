import mongoose from 'mongoose';
import DealQuoteRequest from '../models/dealQuoteRequest.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script to delete all deal quote requests from the database
 * USE WITH CAUTION - This is irreversible!
 */

const deleteDealQuoteRequests = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Use MONGO environment variable (not MONGO_URI)
    await mongoose.connect(process.env.MONGO, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Count existing records
    const count = await DealQuoteRequest.countDocuments();
    console.log(`📊 Found ${count} deal quote request(s) in the database`);

    if (count === 0) {
      console.log('ℹ️  No deal quote requests to delete');
      process.exit(0);
    }

    // Ask for confirmation
    console.log('\n⚠️  WARNING: You are about to delete ALL deal quote requests!');
    console.log('⚠️  This action CANNOT be undone!');
    console.log('\nTo proceed, uncomment the delete line in the script.\n');

    // Delete all records
    const result = await DealQuoteRequest.deleteMany({});

    console.log(`✅ Successfully deleted ${result.deletedCount} deal quote request(s)`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
deleteDealQuoteRequests();
