import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Trip from './models/Trip.js';
import Request from './models/Request.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';

const seedDatabase = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is missing in environment variables');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected for Seeding');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // ===== CREATE MULTIPLE USERS =====
    const users = [
      {
        name: 'Ahmed Khan',
        email: 'ahmed@example.com',
        password: hashedPassword,
        role: 'user',
        verificationStatus: 'Verified',
        gender: 'Male',
        age: 28,
        bio: 'Adventure lover & mountain explorer',
        profileImage: null
      },
      {
        name: 'Fatima Ali',
        email: 'fatima@example.com',
        password: hashedPassword,
        role: 'user',
        verificationStatus: 'Verified',
        gender: 'Female',
        age: 25,
        bio: 'Travel enthusiast from Lahore',
        profileImage: null
      },
      {
        name: 'Hassan Malik',
        email: 'hassan@example.com',
        password: hashedPassword,
        role: 'user',
        verificationStatus: 'Verified',
        gender: 'Male',
        age: 32,
        bio: 'Photography & hiking',
        profileImage: null
      },
      {
        name: 'Zainab Khan',
        email: 'zainab@example.com',
        password: hashedPassword,
        role: 'user',
        verificationStatus: 'Verified',
        gender: 'Female',
        age: 27,
        bio: 'Nature lover',
        profileImage: null
      },
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        verificationStatus: 'Verified',
        gender: 'Prefer not to say',
        age: 30,
        bio: 'System Administrator',
        profileImage: null
      }
    ];

    const createdUsers = await Promise.all(
      users.map(userData =>
        User.findOneAndUpdate(
          { email: userData.email },
          userData,
          { upsert: true, new: true }
        )
      )
    );

    console.log(`✅ ${createdUsers.length} users seeded`);
    console.log('   Ahmed Khan (admin trip creator)');
    console.log('   Fatima Ali');
    console.log('   Hassan Malik');
    console.log('   Zainab Khan');

    // ===== CREATE TRIPS =====
    const ahmedId = createdUsers[0]._id;
    const fatimaId = createdUsers[1]._id;
    const hassanId = createdUsers[2]._id;
    const zainabId = createdUsers[3]._id;

    const trips = [
      {
        creator_id: ahmedId,
        destination: 'Skardu, Gilgit-Baltistan',
        description: 'Amazing skiing experience in Northern Pakistan',
        start_date: new Date('2024-03-01'),
        end_date: new Date('2024-03-07'),
        budget: 50000,
        participants: [fatimaId, hassanId],
        interests: ['Skiing', 'Hiking', 'Photography'],
        status: 'upcoming'
      },
      {
        creator_id: fatimaId,
        destination: 'Hunza Valley, Gilgit-Baltistan',
        description: 'Exploring the beautiful Hunza valley with scenic views',
        start_date: new Date('2024-03-15'),
        end_date: new Date('2024-03-22'),
        budget: 35000,
        participants: [ahmedId, zainabId],
        interests: ['Trekking', 'Photography', 'Cultural Tour'],
        status: 'upcoming'
      },
      {
        creator_id: hassanId,
        destination: 'Naran Kaghan, KPK',
        description: 'Scenic road trip through northern hills',
        start_date: new Date('2024-04-01'),
        end_date: new Date('2024-04-05'),
        budget: 25000,
        participants: [ahmedId],
        interests: ['Road Trip', 'Hiking', 'Camping'],
        status: 'upcoming'
      }
    ];

    const createdTrips = await Promise.all(
      trips.map(tripData => Trip.findOneAndUpdate(
        { creator_id: tripData.creator_id, destination: tripData.destination },
        tripData,
        { upsert: true, new: true }
      ))
    );

    console.log(`✅ ${createdTrips.length} trips created`);
    console.log('   - Skardu Skiing Adventure (Ahmed)');
    console.log('   - Hunza Valley Explorer (Fatima)');
    console.log('   - Naran Kaghan Road Trip (Hassan)');

    // ===== CREATE REQUESTS (Now Accepted) =====
    const requests = [
      {
        from_user_id: fatimaId,
        to_user_id: ahmedId,
        trip_id: createdTrips[0]._id,
        message: 'Salam! Main Skardu skiing trip mein shamil hona chahta hoon. Meri experience baht achhi hai.',
        status: 'accepted'
      },
      {
        from_user_id: hassanId,
        to_user_id: ahmedId,
        trip_id: createdTrips[0]._id,
        message: 'Assalamu alaikum! Can I join your Skardu trip? I have photography skills to offer.',
        status: 'accepted'
      },
      {
        from_user_id: ahmedId,
        to_user_id: fatimaId,
        trip_id: createdTrips[1]._id,
        message: 'Hunza trip bilkul mujhe pasand hai! Main shamil hona chahta hoon.',
        status: 'accepted'
      },
      {
        from_user_id: zainabId,
        to_user_id: fatimaId,
        trip_id: createdTrips[1]._id,
        message: 'Hi! Can I join your Hunza trip? I love nature and trekking!',
        status: 'accepted'
      }
    ];

    const createdRequests = await Promise.all(
      requests.map(reqData => Request.findOneAndUpdate(
        { from_user_id: reqData.from_user_id, trip_id: reqData.trip_id },
        reqData,
        { upsert: true, new: true }
      ))
    );

    console.log(`✅ ${createdRequests.length} requests created & accepted`);

    // ===== CREATE CONVERSATIONS & MESSAGES =====
    // Note: Simplified message creation - will add via direct chat API
    const conversationsData = [
      { participants: [ahmedId, fatimaId] },
      { participants: [ahmedId, hassanId] },
      { participants: [fatimaId, zainabId] },
      { participants: [fatimaId, ahmedId] }
    ];

    // Create Conversations directly
    const createdConversations = await Promise.all(
      conversationsData.map(convData => Conversation.create(convData))
    );

    console.log(`✅ ${createdConversations.length} conversations created`);

    // ===== CREATE MESSAGES (Direct Chat Format) =====
    // Using the directChat message format
    const messagesData = [
      // Ahmed & Fatima conversation
      {
        conversationId: createdConversations[0]._id,
        senderId: fatimaId,
        recipientId: ahmedId,
        message: 'Assalamu alaikum Ahmed! Main Skardu trip mein shamil hona chahta hoon. 😊',
        read: true,
        createdAt: new Date(Date.now() - 86400000)
      },
      {
        conversationId: createdConversations[0]._id,
        senderId: ahmedId,
        recipientId: fatimaId,
        message: 'Walaikum assalam Fatima! Bilkul welcome! 🎉',
        read: true,
        createdAt: new Date(Date.now() - 84600000)
      },
      {
        conversationId: createdConversations[0]._id,
        senderId: fatimaId,
        recipientId: ahmedId,
        message: 'Shukriya! Kab meet up kareinge?',
        read: true,
        createdAt: new Date(Date.now() - 82800000)
      },
      {
        conversationId: createdConversations[0]._id,
        senderId: ahmedId,
        recipientId: fatimaId,
        message: '5 March ko 8 AM agay Islamabad main meet hote hain',
        read: true,
        createdAt: new Date(Date.now() - 79200000)
      },
      {
        conversationId: createdConversations[0]._id,
        senderId: fatimaId,
        recipientId: ahmedId,
        message: 'Perfect! Equipment leke aun gi. Skiing clothes bhi ready hain.',
        read: true,
        createdAt: new Date(Date.now() - 75600000)
      },
      {
        conversationId: createdConversations[0]._id,
        senderId: ahmedId,
        recipientId: fatimaId,
        message: 'Bilkul! Thk hai phir. Bus prepared ho ja. 👍',
        read: true,
        createdAt: new Date(Date.now() - 72000000)
      },
      {
        conversationId: createdConversations[0]._id,
        senderId: fatimaId,
        recipientId: ahmedId,
        message: 'Definitely! excited hoon! See you soon! 🎿',
        read: false,
        createdAt: new Date(Date.now() - 3600000)
      },
      {
        conversationId: createdConversations[0]._id,
        senderId: ahmedId,
        recipientId: fatimaId,
        message: 'Main bhi! Safe journey aur take care! 🙏',
        read: false,
        createdAt: new Date(Date.now() - 1800000)
      },

      // Ahmed & Hassan conversation
      {
        conversationId: createdConversations[1]._id,
        senderId: hassanId,
        recipientId: ahmedId,
        message: 'Hey Ahmed! Skardu trip ka photography karne ke liye permission hai?',
        read: true,
        createdAt: new Date(Date.now() - 172800000)
      },
      {
        conversationId: createdConversations[1]._id,
        senderId: ahmedId,
        recipientId: hassanId,
        message: 'Hassan! Haan bilkul! Mujhe photographers pasand hain. Join kar!',
        read: true,
        createdAt: new Date(Date.now() - 169200000)
      },
      {
        conversationId: createdConversations[1]._id,
        senderId: hassanId,
        recipientId: ahmedId,
        message: 'Awesome! Main drone bhi le aun ga. Aerial shots le deinge.',
        read: true,
        createdAt: new Date(Date.now() - 165600000)
      },
      {
        conversationId: createdConversations[1]._id,
        senderId: ahmedId,
        recipientId: hassanId,
        message: 'Drone! Fantastic idea! Skardu from the sky will look amazing!',
        read: true,
        createdAt: new Date(Date.now() - 162000000)
      },
      {
        conversationId: createdConversations[1]._id,
        senderId: hassanId,
        recipientId: ahmedId,
        message: 'Bilkul! Mein ready hun. Shukriya bhai! 📸',
        read: false,
        createdAt: new Date(Date.now() - 7200000)
      },
      {
        conversationId: createdConversations[1]._id,
        senderId: ahmedId,
        recipientId: hassanId,
        message: 'Welcome aboard! Expectations high hain!',
        read: false,
        createdAt: new Date(Date.now() - 3600000)
      },

      // Fatima & Zainab conversation
      {
        conversationId: createdConversations[2]._id,
        senderId: zainabId,
        recipientId: fatimaId,
        message: 'Hi Fatima! Hunza trip bilkul mujhe pasand hai! Can I join?',
        read: true,
        createdAt: new Date(Date.now() - 259200000)
      },
      {
        conversationId: createdConversations[2]._id,
        senderId: fatimaId,
        recipientId: zainabId,
        message: 'Assalamu alaikum Zainab! Haan bilkul! Aao join karo!',
        read: true,
        createdAt: new Date(Date.now() - 255600000)
      },
      {
        conversationId: createdConversations[2]._id,
        senderId: zainabId,
        recipientId: fatimaId,
        message: 'Shukriya! Main hiking experience rakhti hoon. Kya camping hogi?',
        read: true,
        createdAt: new Date(Date.now() - 252000000)
      },
      {
        conversationId: createdConversations[2]._id,
        senderId: fatimaId,
        recipientId: zainabId,
        message: 'Haan camping bhi hogi aur trek bhi. Full adventure! 🏕️',
        read: false,
        createdAt: new Date(Date.now() - 10800000)
      },
      {
        conversationId: createdConversations[2]._id,
        senderId: zainabId,
        recipientId: fatimaId,
        message: 'Amazing! Mein ready hun. See you March 15! 🏔️',
        read: false,
        createdAt: new Date(Date.now() - 5400000)
      }
    ];

    const createdMessages = await Promise.all(
      messagesData.map(msgData =>
        Message.create(msgData).catch(err => {
          console.warn('⚠️ Message creation issue (schema may differ):', err.message.substring(0, 80));
          return null;
        })
      )
    ).then(msgs => msgs.filter(m => m !== null));

    console.log(`✅ ${createdMessages.length} messages created`);

    console.log('\n' + '='.repeat(60));
    console.log('✨ DATABASE SEEDING COMPLETE! ✨');
    console.log('='.repeat(60));
    console.log('\n📝 LOGIN CREDENTIALS (Password: password123)');
    console.log('   Ahmed Khan: ahmed@example.com');
    console.log('   Fatima Ali: fatima@example.com');
    console.log('   Hassan Malik: hassan@example.com');
    console.log('   Zainab Khan: zainab@example.com');
    console.log('   Admin: admin@example.com\n');

    console.log('📊 DATA SUMMARY:');
    console.log(`   Users: ${createdUsers.length}`);
    console.log(`   Trips: ${createdTrips.length}`);
    console.log(`   Request (Accepted): ${createdRequests.length}`);
    console.log(`   Conversations: ${createdConversations.length}`);
    console.log(`   Messages: ${createdMessages.length}\n`);

    console.log('🚀 NEXT STEPS:');
    console.log('   1. Start backend: npm start');
    console.log('   2. Start frontend: npm run dev');
    console.log('   3. Login as any user above');
    console.log('   4. Go to /chat to see conversations');
    console.log('   5. Go to /requests to see accepted requests\n');

    process.exit();
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

seedDatabase();
