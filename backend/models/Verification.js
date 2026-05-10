import mongoose from 'mongoose';

const verificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cnicImage: {
    type: String, // URL or base64
    required: true
  },
  selfieImage: {
    type: String, // URL or base64
    required: true
  },
  ocrData: {
    cnicNumber: String,
    name: String,
    dob: String,
    expiryDate: String
  },
  faceMatchScore: {
    type: Number, // 0-100
    default: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  adminComments: {
    type: String
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Verification = mongoose.model('Verification', verificationSchema);

export default Verification;
