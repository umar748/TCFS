import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
  },
  { timestamps: true }
);

const SimpleUser = mongoose.model('SimpleUser', userSchema);
export default SimpleUser;
