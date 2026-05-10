import mongoose from 'mongoose';

const aiConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true, // e.g., 'system_prompt', 'safety_guidelines'
  },
  value: {
    type: mongoose.Schema.Types.Mixed, // Can be string, boolean, object
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

const AIConfig = mongoose.model('AIConfig', aiConfigSchema);

export default AIConfig;
