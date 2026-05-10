import mongoose from 'mongoose';
import Trip from '../models/Trip.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/TCFS';

async function main() {
  await mongoose.connect(MONGO_URI);
  const trips = await Trip.find({}).select('_id');
  const ids = trips.map(t => t._id);
  // Delete related chats and messages
  if (ids.length) {
    const chats = await Chat.find({ trip_id: { $in: ids } }).select('_id');
    const chatIds = chats.map(c => c._id);
    await Message.deleteMany({ chat_id: { $in: chatIds } });
    await Chat.deleteMany({ trip_id: { $in: ids } });
  }
  const res = await Trip.deleteMany({});
  // eslint-disable-next-line no-console
  console.log(`Deleted trips: ${res.deletedCount}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('Failed to delete all trips:', e);
  process.exit(1);
});

