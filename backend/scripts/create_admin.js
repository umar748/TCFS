import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const createAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/tcfs';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const adminEmail = 'admin@tcfs.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin user already exists. Updating password and role...');
      const salt = await bcrypt.genSalt(10);
      existingAdmin.password = await bcrypt.hash('Admin@123', salt);
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log('Admin user updated successfully');
    } else {
      console.log('Creating new admin user...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@123', salt);

      const admin = new User({
        name: 'System Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        verificationStatus: 'Verified',
        authProvider: 'local'
      });

      await admin.save();
      console.log('Admin user created successfully');
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();