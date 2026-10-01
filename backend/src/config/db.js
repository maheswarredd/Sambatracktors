import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongodInstance = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  try {
    if (uri && !uri.includes('localhost:27017')) {
      console.log('Connecting to provided MONGODB_URI...');
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log(`[MongoDB] Connected to database: ${mongoose.connection.host}`);
      return;
    }

    // Try connecting to default local URI first if provided
    if (uri) {
      try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
        console.log(`[MongoDB] Connected to local MongoDB: ${mongoose.connection.host}`);
        return;
      } catch (err) {
        console.warn(`[MongoDB] Could not reach local MongoDB at ${uri}. Falling back to embedded MongoMemoryServer...`);
      }
    }

    // Fallback: Start MongoMemoryServer for immediate plug-and-play execution
    console.log('[MongoDB] Initializing MongoMemoryServer for zero-config persistence...');
    mongodInstance = await MongoMemoryServer.create();
    const memoryUri = mongodInstance.getUri();
    await mongoose.connect(memoryUri);
    console.log(`[MongoDB] Connected to in-memory MongoDB at: ${memoryUri}`);
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    process.exit(1);
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};
