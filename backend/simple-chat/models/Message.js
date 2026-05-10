import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'SimpleUser', required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);
export default Message;
