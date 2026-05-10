import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error('Usage: node scripts/reset_password.js <email> <newPassword>');
  process.exit(1);
}

const run = async () => {
  const User = (await import('../models/User.js')).default;
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email });
    if (!user) {
      console.log(JSON.stringify({ success: false, message: 'User not found' }, null, 2));
      return;
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    console.log(JSON.stringify({ success: true, id: user._id.toString(), email: user.email }, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await mongoose.connection.close();
  }
};

run();
