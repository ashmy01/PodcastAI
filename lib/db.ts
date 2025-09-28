import mongoose from 'mongoose';

// Import models to ensure they are registered with Mongoose
import './models/Podcast';
import './models/Episode';
import './models/AdPlacement';
import './models/Campaign';
import './models/CampaignAnalytics';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/podcast-ai';

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
