import mongoose from 'mongoose';

const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: (value) => nameRegex.test(value),
      message: 'Name must contain alphabets only'
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function() { return this.authProvider !== 'google'; },
  },
  profilePicture: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    default: '',
  },
  age: {
    type: Number,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
  },
  interests: [{
    type: String,
  }],
  travelStyle: {
    type: String,
    default: '',
  },
  googleId: {
    type: String,
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  location: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isBlocked: {
    type: Boolean,
    default: false
  },
  isMessagingBlocked: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['Not Verified', 'Pending', 'Verified', 'Rejected'],
    default: 'Not Verified'
  },
  profileCompletion: {
    type: Number,
    default: 0
  },
  resetToken: {
    type: String,
  },
  resetTokenExpiry: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Calculate profile completion before saving
userSchema.pre('save', async function() {
  let score = 0;
  if (this.name) score += 10;
  if (this.email) score += 10;
  if (this.profilePicture) score += 10;
  if (this.bio) score += 10;
  if (this.age) score += 10;
  if (this.gender) score += 10;
  if (this.interests && this.interests.length > 0) score += 10;
  if (this.travelStyle) score += 10;
  if (this.location) score += 20;
  this.profileCompletion = score;
});

const User = mongoose.model('User', userSchema);

export default User;
