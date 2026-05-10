import mongoose from 'mongoose';
import Trip from '../models/Trip.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/TCFS';

async function main() {
  await mongoose.connect(MONGO_URI);
  const targets = [
    'Skardu, Gilgit-Baltistan',
    'Hunza Valley, Gilgit-Baltistan',
    'Naran Kaghan, KPK',
    'lahore',
  ];
  const res = await Trip.deleteMany({ destination: { $in: targets } });
  // eslint-disable-next-line no-console
  console.log(`Deleted trips: ${res.deletedCount}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('Failed to delete trips:', e);
  process.exit(1);
});

