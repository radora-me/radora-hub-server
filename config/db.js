import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export let isMongoConnected = false;
export const DATA_FILE = path.join(__dirname, '..', 'data', 'radora_db.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/radora_hub';

  try {
    const maskedUri = mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
    console.log(`[Radora Hub] Connecting to MongoDB: ${maskedUri}...`);
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 6000,
    });
    isMongoConnected = true;
    console.log(`[Radora Hub] MongoDB Atlas Connected successfully: ${mongoose.connection.host}`);
  } catch (error) {
    isMongoConnected = false;
    console.warn(`[Radora Hub] MongoDB connection not available (${error.message}).`);
    console.log(`[Radora Hub] Operating in high-reliability local persistent DB mode: ${DATA_FILE}`);
  }
};
