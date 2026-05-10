import User from '../models/User.js';
import Trip from '../models/Trip.js';
import Notification from '../models/Notification.js';
import { findTravelCompanions } from '../services/matchingService.js';

export const getDashboardData = async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Fetch User Data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 2. Fetch Active/Upcoming Trips
    const trips = await Trip.find({
      members: userId,
      status: { $in: ['Upcoming', 'Ongoing'] }
    }).sort({ startDate: 1 }).limit(3);

    // 3. Fetch Unread Notifications
    const notifications = await Notification.find({
      userId: userId,
      read: false
    }).sort({ createdAt: -1 }).limit(5);

    // 4. Get Matches (Using existing matching service)
    // Heuristic: If user has travel plans, use the first one for matching
    let matches = [];
    if (user.travelPlans && user.travelPlans.length > 0) {
      const plan = user.travelPlans[0];
      try {
        matches = await findTravelCompanions(user, {
          destination: plan.destination,
          date: plan.startDate,
          genderPreference: 'Any' // Default
        });
      } catch (err) {
        console.error("Matching error:", err);
      }
    }
    // Limit matches to top 3
    matches = matches.slice(0, 3);

    res.json({
      success: true,
      data: {
        profile: {
          name: user.name,
          completion: user.profileCompletion,
          verificationStatus: user.verificationStatus,
          isVerified: user.verificationStatus === 'Verified'
        },
        stats: {
          totalMatches: matches.length, // Ideally count total
          activeTripsCount: trips.length
        },
        matches: matches,
        trips: trips,
        notifications: notifications
      }
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
