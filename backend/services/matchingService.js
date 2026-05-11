import User from '../models/User.js';
import Trip from '../models/Trip.js';
import Notification from '../models/Notification.js';

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

export const findTravelCompanions = async (currentUser, criteria = {}) => {
  const { destination = '', genderPreference = 'Any' } = criteria;
  const destinationText = normalize(destination);

  const query = {
    _id: { $ne: currentUser._id },
    isBlocked: false,
  };

  if (genderPreference && genderPreference !== 'Any') {
    query.gender = genderPreference;
  }

  if (currentUser.age) {
    query.age = {
      $gte: currentUser.age - 5,
      $lte: currentUser.age + 5,
    };
  }

  const candidates = await User.find(query)
    .select('name age gender location bio interests travelStyle verificationStatus profileCompletion')
    .lean();

  const currentInterests = Array.isArray(currentUser.interests)
    ? currentUser.interests.map(normalize)
    : [];

  const matches = candidates.map((user) => {
    let score = 0;
    const reasons = [];

    const userLocation = normalize(user.location);
    const userBio = normalize(user.bio);
    const userInterests = Array.isArray(user.interests) ? user.interests.map(normalize) : [];

    if (destinationText) {
      const locationMatch = userLocation.includes(destinationText) || destinationText.includes(userLocation);
      const bioMatch = userBio.includes(destinationText);
      const interestMatch = userInterests.some((item) => item.includes(destinationText));

      if (locationMatch) {
        score += 40;
        reasons.push(`Based in or near ${destination}`);
      } else if (bioMatch || interestMatch) {
        score += 20;
        reasons.push(`Shows interest in ${destination}`);
      }
    }

    const sharedInterests = userInterests.filter((item) => currentInterests.includes(item));
    if (sharedInterests.length > 0) {
      score += Math.min(30, sharedInterests.length * 10);
      reasons.push(`Shared interests: ${sharedInterests.slice(0, 3).join(', ')}`);
    }

    if (user.travelStyle && currentUser.travelStyle && user.travelStyle === currentUser.travelStyle) {
      score += 12;
      reasons.push(`Similar travel style: ${user.travelStyle}`);
    }

    if (user.verificationStatus === 'Verified') {
      score += 10;
      reasons.push('Verified member');
    }

    if (user.profileCompletion) {
      score += Math.round(user.profileCompletion / 15);
    }

    return {
      userId: user._id,
      name: user.name,
      age: user.age,
      gender: user.gender,
      location: user.location || 'Unknown',
      compatibilityScore: score,
      reasons,
    };
  });

  return matches
    .filter((match) => match.compatibilityScore > 0)
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, 5);
};

export const findMatchingTrips = async (user) => {
  try {
    // Get all upcoming trips (excluding trips created by the current user)
    const upcomingTrips = await Trip.find({
      creator_id: { $ne: user._id },
      status: 'upcoming',
      start_date: { $gte: new Date() }
    })
      .populate('creator_id', 'name email')
      .lean();

    if (!upcomingTrips || upcomingTrips.length === 0) {
      return [];
    }

    const userInterests = Array.isArray(user.interests)
      ? user.interests.map(normalize)
      : [];
    const userBudget = user.budget || Infinity;
    const userLocation = normalize(user.location || '');

    const matchedTrips = upcomingTrips.map((trip) => {
      let matchScore = 0;
      const matchReasons = [];

      // Interest matching
      const tripInterests = Array.isArray(trip.interests)
        ? trip.interests.map(normalize)
        : [];
      const sharedInterests = tripInterests.filter((interest) =>
        userInterests.includes(interest)
      );

      if (sharedInterests.length > 0) {
        matchScore += Math.min(40, sharedInterests.length * 15);
        matchReasons.push(`Shared interests: ${sharedInterests.slice(0, 3).join(', ')}`);
      }

      // Budget matching
      if (trip.budget <= userBudget) {
        const budgetPercentage = (trip.budget / userBudget) * 100;
        if (budgetPercentage <= 100) {
          matchScore += 30;
          matchReasons.push(`Within your budget (PKR ${trip.budget})`);
        }
      } else {
        // Budget is higher but still give some points
        const overBudgetPercentage = ((trip.budget - userBudget) / userBudget) * 100;
        if (overBudgetPercentage <= 50) {
          matchScore += 15;
          matchReasons.push(`Slightly above your budget (PKR ${trip.budget})`);
        }
      }

      // Destination/Location matching
      const tripDestination = normalize(trip.destination || '');
      const destinationMatches =
        tripDestination.includes(userLocation) ||
        userLocation.includes(tripDestination);

      if (destinationMatches && userLocation) {
        matchScore += 25;
        matchReasons.push(`Destination matches your location preferences`);
      }

      // Basic match threshold
      if (matchScore >= 20) {
        return {
          tripId: trip._id,
          destination: trip.destination,
          budget: trip.budget,
          startDate: trip.start_date,
          endDate: trip.end_date,
          description: trip.description,
          image: trip.image,
          interests: trip.interests,
          creatorName: trip.creator_id?.name || 'Unknown',
          creatorId: trip.creator_id?._id,
          matchScore,
          matchReasons
        };
      }

      return null;
    })
      .filter((match) => match !== null)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10); // Return top 10 matching trips

    return matchedTrips;
  } catch (error) {
    console.error('Error finding matching trips:', error);
    return [];
  }
};

export const sendTripMatchNotifications = async (userId, io = null) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found for sending notifications');
      return [];
    }

    // Find matching trips
    const matchingTrips = await findMatchingTrips(user);

    if (matchingTrips.length === 0) {
      return [];
    }

    // Send notifications for each matching trip
    const createdNotifications = [];
    for (const trip of matchingTrips) {
      // Check if notification already exists for this trip
      const existingNotification = await Notification.findOne({
        userId,
        tripId: trip.tripId,
        type: 'Trip Request'
      });

      if (existingNotification) {
        continue;
      }

      // Create notification
      const matchMessage = `We found a matching trip to ${trip.destination} by ${trip.creatorName}! ${trip.matchReasons.length > 0 ? 'Reason: ' + trip.matchReasons[0] : ''} Budget: PKR ${trip.budget}`;

      const notification = await Notification.create({
        userId,
        tripId: trip.tripId,
        type: 'Trip Request',
        message: matchMessage,
        read: false
      });

      createdNotifications.push(notification);

      // Send real-time notification via socket if available
      if (io) {
        io.to(String(userId)).emit('newNotification', {
          ...notification.toObject(),
          _id: notification._id
        });
      }
    }

    console.log(`Sent ${createdNotifications.length} trip match notifications to user ${userId}`);
    return createdNotifications;
  } catch (error) {
    console.error('Error sending trip match notifications:', error);
    return [];
  }
};
