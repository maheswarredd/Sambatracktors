import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log('Connecting to provided MongoDB URI...');
      await mongoose.connect(uri);
      console.log('MongoDB Atlas / Remote Database Connected successfully');
      return;
    } catch (err) {
      console.warn('Failed connecting to remote MongoDB URI, falling back to embedded MongoMemoryServer:', err.message);
    }
  }

  try {
    console.log('Initializing embedded MongoMemoryServer for development...');
    mongoMemoryServer = await MongoMemoryServer.create();
    const memoryUri = mongoMemoryServer.getUri();
    await mongoose.connect(memoryUri);
    console.log('Connected to embedded MongoMemoryServer at:', memoryUri);
  } catch (error) {
    console.error('Fatal error connecting to database:', error);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};
