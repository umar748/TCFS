import AIConfig from '../models/AIConfig.js';
import User from '../models/User.js';
import Verification from '../models/Verification.js';
import Report from '../models/Report.js';
import Trip from '../models/Trip.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';

// Stats
export const getStats = async (req, res) => {
  try {
    const now = new Date();
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ verificationStatus: 'Verified' });
    const pendingVerifications = await Verification.countDocuments({ status: 'Pending' });
    const totalReports = await Report.countDocuments({});
    const totalTrips = await Trip.countDocuments({});
    const blockedUsers = await User.countDocuments({ isBlocked: true });

    // Monthly registrations (last 6 months)
    const firstMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthly = await User.aggregate([
      { $match: { createdAt: { $gte: firstMonth } } },
      { $group: { _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { "_id.y": 1, "_id.m": 1 } }
    ]);
    const monthlyDbData = monthly.map(x => ({ year: x._id.y, month: x._id.m, count: x.count }));

    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        name: d.toLocaleString('default', { month: 'short' }),
      });
    }

    const monthlyRegistrations = last6Months.map(m => {
      const found = monthlyDbData.find(d => d.month === m.month && d.year === m.year);
      return { ...m, count: found ? found.count : 0 };
    });

    // Popular destinations (top 5)
    const popularAgg = await Trip.aggregate([
      { $group: { _id: "$destination", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    const popularDestinations = popularAgg.map(x => ({ destination: x._id, count: x.count }));

    // Calculate trends (comparing this month vs last month)
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const usersThisMonth = await User.countDocuments({ createdAt: { $gte: firstDayThisMonth } });
    const usersLastMonth = await User.countDocuments({ createdAt: { $gte: firstDayLastMonth, $lt: firstDayThisMonth } });
    const userTrend = usersLastMonth === 0 ? 100 : Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100);

    const tripsThisMonth = await Trip.countDocuments({ created_at: { $gte: firstDayThisMonth } });
    const tripsLastMonth = await Trip.countDocuments({ created_at: { $gte: firstDayLastMonth, $lt: firstDayThisMonth } });
    const tripTrend = tripsLastMonth === 0 ? 100 : Math.round(((tripsThisMonth - tripsLastMonth) / tripsLastMonth) * 100);

    const reportsThisMonth = await Report.countDocuments({ createdAt: { $gte: firstDayThisMonth } });
    const reportsLastMonth = await Report.countDocuments({ createdAt: { $gte: firstDayLastMonth, $lt: firstDayThisMonth } });
    const reportTrend = reportsLastMonth === 0 ? 0 : Math.round(((reportsThisMonth - reportsLastMonth) / reportsLastMonth) * 100);

    res.json({
      success: true,
      stats: {
        totalUsers,
        verifiedUsers,
        pendingVerifications,
        totalReports,
        totalTrips,
        blockedUsers,
        monthlyRegistrations,
        popularDestinations,
        trends: {
          users: { value: userTrend, direction: userTrend >= 0 ? 'up' : 'down' },
          trips: { value: tripTrend, direction: tripTrend >= 0 ? 'up' : 'down' },
          reports: { value: Math.abs(reportTrend), direction: reportTrend >= 0 ? 'up' : 'down' }
        }
      }
    });
  } catch (error) {
    console.error("GetStats Error:", error);
    res.status(500).json({ success: false, message: "Error fetching stats" });
  }
};

// User Management
export const getUsers = async (req, res) => {
  try {
    const { search, role, status } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) query.role = role;
    if (status === 'blocked') {
      query.isBlocked = true;
    } else if (status === 'active') {
      query.isBlocked = false;
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching users" });
  }
};

export const manageUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action } = req.body; // 'block', 'unblock', 'delete', 'blockMessaging', 'unblockMessaging', 'verify'

    if (action === 'delete') {
      await User.findByIdAndDelete(userId);
      return res.json({ success: true, message: "User deleted" });
    }

    const updates = {};
    if (action === 'block') updates.isBlocked = true;
    if (action === 'unblock') updates.isBlocked = false;
    if (action === 'blockMessaging') updates.isMessagingBlocked = true;
    if (action === 'unblockMessaging') updates.isMessagingBlocked = false;
    if (action === 'verify') updates.verificationStatus = 'Verified';

    const user = await User.findByIdAndUpdate(userId, updates, { new: true });
    
    // Notify user of action
    if (action === 'block' || action === 'verify') {
      await Notification.create({
        userId: userId,
        type: 'System',
        message: action === 'block' ? 'Your account has been blocked by an admin.' : 'Your account has been verified as a Verified Traveler!'
      });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error managing user" });
  }
};

// Verification Management
export const getVerifications = async (req, res) => {
  try {
    const verifications = await Verification.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, verifications });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching verifications" });
  }
};

export const handleVerification = async (req, res) => {
  try {
    const { id } = req.params; // Verification ID
    const { action, comments } = req.body; // 'approve', 'reject'

    const verification = await Verification.findById(id);
    if (!verification) return res.status(404).json({ success: false, message: "Verification not found" });

    if (action === 'approve') {
      verification.status = 'Approved';
      await User.findByIdAndUpdate(verification.user, { verificationStatus: 'Verified' });
    } else if (action === 'reject') {
      verification.status = 'Rejected';
      await User.findByIdAndUpdate(verification.user, { verificationStatus: 'Rejected' });
    }
    
    verification.adminComments = comments;
    verification.reviewedBy = req.user.userId;
    verification.reviewedAt = Date.now();
    await verification.save();

    // Send notification
    await Notification.create({
      userId: verification.user,
      type: 'Verification',
      message: action === 'approve' ? 'Your identity verification request has been approved!' : `Your identity verification request was rejected. Reason: ${comments}`
    });

    res.json({ success: true, verification });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error handling verification" });
  }
};

// Report Management
export const getReports = async (req, res) => {
  try {
    const reports = await Report.find().populate('createdBy', 'name email').populate('targetUser', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching reports" });
  }
};

export const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminAction } = req.body;

    const report = await Report.findByIdAndUpdate(id, { status, adminAction }, { new: true });
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating report" });
  }
};

// Trip Management
export const getAllTrips = async (req, res) => {
  try {
    const trips = await Trip.find().populate('creator_id', 'name email').populate('participants', 'name email').sort({ created_at: -1 });
    res.json({ success: true, trips });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching trips" });
  }
};

export const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const trip = await Trip.findByIdAndUpdate(id, updates, { new: true });
    res.json({ success: true, trip });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating trip" });
  }
};

export const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;
    await Trip.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting trip" });
  }
};

// Chat moderation
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting message" });
  }
};

// Broadcast System Notification
export const sendBroadcast = async (req, res) => {
  try {
    const { message, type } = req.body; // type: 'System', 'Trip Update', etc.
    if (!message) return res.status(400).json({ success: false, message: "Message is required" });

    const users = await User.find({ role: 'user' });
    const notifications = users.map(user => ({
      userId: user._id,
      type: type || 'System',
      message: message
    }));

    await Notification.insertMany(notifications);
    res.json({ success: true, message: `Broadcast sent to ${users.length} users` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error sending broadcast" });
  }
};

// AI & System Settings
export const updateAIConfig = async (req, res) => {
  const { key, value } = req.body;

  if (!key || value === undefined) {
    return res.status(400).json({ success: false, message: "Missing key or value" });
  }

  try {
    const config = await AIConfig.findOneAndUpdate(
      { key },
      { value, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating config" });
  }
};

export const getAIConfig = async (req, res) => {
  try {
    const configs = await AIConfig.find({});
    res.json({ success: true, configs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching configs" });
  }
};

export const getDestinations = async (req, res) => {
  try {
    const destinations = await Trip.aggregate([
      { $match: { destination: { $exists: true, $ne: "" } } },
      { $group: { _id: "$destination", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log("Found destinations:", destinations); // Server-side debug

    const formattedDestinations = destinations.map(x => ({ 
      destination: x._id, 
      count: x.count 
    }));
    
    res.json({ success: true, destinations: formattedDestinations });
  } catch (error) {
    console.error("Aggregation error:", error);
    res.status(500).json({ success: false, message: "Error fetching destinations" });
  }
};

export const getDestinationDetail = async (req, res) => {
  try {
    const { name } = req.params;
    const decodedName = decodeURIComponent(name);
    console.log("Fetching details for destination (decoded):", decodedName);
    
    // Find trips with case-insensitive match
    const trips = await Trip.find({ 
      destination: { $regex: new RegExp(`^${decodedName.trim()}$`, 'i') } 
    })
    .populate('creator_id', 'name email location bio profile_picture verificationStatus')
    .populate('participants', 'name email location profile_picture verificationStatus')
    .sort({ created_at: -1 });

    console.log(`Query: { destination: { $regex: /^${decodedName.trim()}$/i } }`);
    console.log(`Found ${trips.length} trips for ${decodedName}`);
    if (trips.length > 0) {
      console.log("Sample trip destination:", trips[0].destination);
    }

    res.json({ 
      success: true, 
      destination: decodedName,
      trips 
    });
  } catch (error) {
    console.error("Error fetching destination details:", error);
    res.status(500).json({ success: false, message: "Error fetching destination details" });
  }
};
