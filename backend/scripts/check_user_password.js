import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node scripts/check_user_password.js <email> <password>');
  process.exit(1);
}

const run = async () => {
  const User = (await import('../models/User.js')).default;
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email });
    if (!user) {
      console.log(JSON.stringify({ exists: false }, null, 2));
      return;
    }
    if (!user.password) {
      console.log(JSON.stringify({ exists: true, hasPassword: false, match: false }, null, 2));
      return;
    }
    const match = await bcrypt.compare(password, user.password);
    console.log(JSON.stringify({ exists: true, hasPassword: true, match, role: user.role, isBlocked: user.isBlocked }, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await mongoose.connection.close();
  }
};

run();
