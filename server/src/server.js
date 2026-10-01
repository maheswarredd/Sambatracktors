require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('./app');
const { initSocket } = require('./socket');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/samba-tractors';
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 5000;

// ---------------------------------------------------------------------------
// HTTP Server + Socket.IO
// ---------------------------------------------------------------------------
const httpServer = http.createServer(app);
const io = initSocket(httpServer);

// Make io accessible from route handlers via app locals
app.set('io', io);

// ---------------------------------------------------------------------------
// MongoDB connection with retry logic
// ---------------------------------------------------------------------------
let retryCount = 0;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
    retryCount = 0; // Reset on success

    // Run seed functions after successful connection
    await seedAdminUser();
    await seedDefaultServices();
  } catch (error) {
    retryCount += 1;
    console.error(`[DB] Connection failed (attempt ${retryCount}/${MAX_RETRY_ATTEMPTS}):`, error.message);

    if (retryCount < MAX_RETRY_ATTEMPTS) {
      console.log(`[DB] Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      setTimeout(connectDB, RETRY_DELAY_MS);
    } else {
      console.error('[DB] Max retry attempts reached. Shutting down.');
      process.exit(1);
    }
  }
};

// Handle mongoose connection events
mongoose.connection.on('disconnected', () => {
  console.warn('[DB] MongoDB disconnected. Attempting to reconnect...');
  if (retryCount < MAX_RETRY_ATTEMPTS) {
    setTimeout(connectDB, RETRY_DELAY_MS);
  }
});

mongoose.connection.on('error', (err) => {
  console.error('[DB] MongoDB connection error:', err.message);
});

// ---------------------------------------------------------------------------
// Seed: Admin User
// ---------------------------------------------------------------------------
const seedAdminUser = async () => {
  try {
    const User = require('./models/User');
    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
      console.log('[Seed] Admin user already exists. Skipping.');
      return;
    }

    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD || 'Admin@1234',
      12
    );

    await User.create({
      name: process.env.ADMIN_NAME || 'Samba Admin',
      email: process.env.ADMIN_EMAIL || 'admin@sambatractors.com',
      phone: '9000000000',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      isVerified: true,
    });

    console.log(`[Seed] ✅ Admin user created: ${process.env.ADMIN_EMAIL || 'admin@sambatractors.com'}`);
  } catch (error) {
    console.error('[Seed] Failed to seed admin user:', error.message);
  }
};

// ---------------------------------------------------------------------------
// Seed: Default Services
// ---------------------------------------------------------------------------
const seedDefaultServices = async () => {
  try {
    const Service = require('./models/Service');
    const count = await Service.countDocuments();

    if (count > 0) {
      console.log(`[Seed] ${count} service(s) already exist. Skipping.`);
      return;
    }

    const defaultServices = [
      {
        name: 'Land Ploughing',
        description: 'Deep ploughing of agricultural land to prepare soil for sowing.',
        category: 'ploughing',
        pricePerAcre: 800,
        duration: 4,
        availableTimeSlots: ['morning', 'afternoon', 'full-day'],
        isActive: true,
      },
      {
        name: 'Seed Sowing',
        description: 'Mechanised sowing of seeds with precise row spacing and depth control.',
        category: 'sowing',
        pricePerAcre: 600,
        duration: 3,
        availableTimeSlots: ['morning', 'afternoon', 'evening', 'full-day'],
        isActive: true,
      },
      {
        name: 'Crop Harvesting',
        description: 'Efficient harvesting of mature crops using combine attachments.',
        category: 'harvesting',
        pricePerAcre: 1200,
        duration: 5,
        availableTimeSlots: ['morning', 'full-day'],
        isActive: true,
      },
      {
        name: 'Pesticide Spraying',
        description: 'Uniform spraying of pesticides and fertilisers across the field.',
        category: 'spraying',
        pricePerAcre: 400,
        duration: 2,
        availableTimeSlots: ['morning', 'evening'],
        isActive: true,
      },
      {
        name: 'Produce Transportation',
        description: 'Transportation of harvested produce to storage facilities or markets.',
        category: 'transportation',
        pricePerAcre: 500,
        duration: 3,
        availableTimeSlots: ['morning', 'afternoon', 'evening', 'full-day'],
        isActive: true,
      },
    ];

    await Service.insertMany(defaultServices);
    console.log(`[Seed] ✅ ${defaultServices.length} default services seeded.`);
  } catch (error) {
    console.error('[Seed] Failed to seed default services:', error.message);
  }
};

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const startServer = async () => {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  🚜 Samba Tractors API`);
    console.log(`  🌐 Port     : ${PORT}`);
    console.log(`  🔧 Env      : ${process.env.NODE_ENV || 'development'}`);
    console.log(`  📡 Socket   : enabled`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  });
};

startServer();

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
const shutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);

  httpServer.close(async (err) => {
    if (err) {
      console.error('[Server] Error closing HTTP server:', err.message);
    } else {
      console.log('[Server] HTTP server closed.');
    }

    try {
      await mongoose.connection.close(false);
      console.log('[DB] MongoDB connection closed.');
    } catch (dbErr) {
      console.error('[DB] Error closing MongoDB connection:', dbErr.message);
    }

    console.log('[Server] Graceful shutdown complete. Goodbye 👋');
    process.exit(0);
  });

  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout.');
    process.exit(1);
  }, 15000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process] Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, exit so the process manager can restart
  if (process.env.NODE_ENV === 'production') {
    shutdown('unhandledRejection');
  }
});

process.on('uncaughtException', (error) => {
  console.error('[Process] Uncaught Exception:', error);
  shutdown('uncaughtException');
});

module.exports = { httpServer, io };
