import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB, isMongoConnected } from '../config/db.js';
import { Project } from '../models/Project.js';
import { Checklist } from '../models/Checklist.js';
import { Template } from '../models/Template.js';
import { defaultProjects, defaultChecklists, defaultTemplates } from './seedData.js';
import { dataService } from '../services/dataService.js';

dotenv.config();

const runSeed = async () => {
  console.log('[Radora Hub] Starting database seed process...');
  await connectDB();

  if (isMongoConnected) {
    try {
      console.log('[Radora Hub] Clearing existing MongoDB collections...');
      await Project.deleteMany({});
      await Checklist.deleteMany({});
      await Template.deleteMany({});

      console.log('[Radora Hub] Inserting default templates...');
      await Template.insertMany(defaultTemplates);

      console.log('[Radora Hub] Inserting default projects...');
      await Project.insertMany(defaultProjects);

      console.log('[Radora Hub] Inserting default checklists...');
      await Checklist.insertMany(defaultChecklists);

      console.log('✅ MongoDB seeded successfully!');
    } catch (err) {
      console.error('Error seeding MongoDB:', err);
    } finally {
      await mongoose.disconnect();
    }
  } else {
    dataService.resetDatabase();
    console.log('✅ Local JSON persistent store reset and seeded successfully!');
  }
  process.exit(0);
};

runSeed();
