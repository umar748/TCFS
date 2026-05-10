import mongoose from 'mongoose';

const chatRoomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SimpleUser' }],
  },
  { timestamps: true }
);

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);
export default ChatRoom;
