import Trip from '../models/Trip.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

const normalizeDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const validateTripDates = (start_date, end_date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = normalizeDate(start_date);
  const endDate = normalizeDate(end_date);

  if (!startDate || !endDate) {
    return { error: 'Invalid trip dates' };
  }

  if (startDate < today) {
    return { error: 'Start date must be today or a future date' };
  }

  if (endDate < today) {
    return { error: 'End date must be today or a future date' };
  }

  if (endDate < startDate) {
    return { error: 'End date must be the same as or after the start date' };
  }

  return { startDate, endDate };
};

const buildTripMatchContext = ({ destination, description, interests }) => {
  return [destination, description, ...(Array.isArray(interests) ? interests : [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

const findMatchingUsersForTrip = async ({ creatorId, destination, description, interests }) => {
  const normalizedInterests = Array.isArray(interests)
    ? interests.map((item) => String(item).trim().toLowerCase()).filter(Boolean)
    : [];
  const tripContext = buildTripMatchContext({ destination, description, interests });

  const users = await User.find({
    _id: { $ne: creatorId },
    role: 'user',
    isBlocked: false
  }).select('name interests travelStyle');

  return users.filter((user) => {
    const userInterests = Array.isArray(user.interests)
      ? user.interests.map((item) => String(item).trim().toLowerCase()).filter(Boolean)
      : [];
    const hasSharedInterest = normalizedInterests.some((interest) => userInterests.includes(interest));

    const travelStyle = String(user.travelStyle || '').trim().toLowerCase();
    const hasTravelStyleMatch = travelStyle.length > 0 && tripContext.includes(travelStyle);

    return hasSharedInterest || hasTravelStyleMatch;
  });
};

export const createTrip = async (req, res) => {
  try {
    const { destination, start_date, end_date, budget, description, interests, image } = req.body;
    if (!destination || !start_date || !end_date || !budget || !description) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }
    const { startDate, endDate, error } = validateTripDates(start_date, end_date);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const trip = await Trip.create({
      destination,
      start_date: startDate,
      end_date: endDate,
      budget,
      description,
      image: typeof image === 'string' ? image : '',
      interests,
      participants: [req.user.userId],
      creator_id: req.user.userId
    });

    const populatedTrip = await Trip.findById(trip._id)
      .populate('creator_id', 'name email profilePicture');

    const matchingUsers = await findMatchingUsersForTrip({
      creatorId: req.user.userId,
      destination,
      description,
      interests
    });

    if (matchingUsers.length > 0) {
      const tripMessage = `${req.user.name || 'A traveler'} created a new trip to ${destination}. Check the trip details and see if it matches your interests.`;
      const notifications = await Notification.insertMany(
        matchingUsers.map((user) => ({
          userId: user._id,
          fromUserId: req.user.userId,
          tripId: trip._id,
          type: 'Trip Update',
          message: tripMessage
        }))
      );

      const io = req.app.get('io');
      if (io) {
        notifications.forEach((notification) => {
          io.to(String(notification.userId)).emit('newNotification', {
            ...notification.toObject(),
            _id: notification._id
          });
        });
      }
    }
    
    // Notify all users about new trip via socket (handled in server.js or socket handler)
    if (req.app.get('io')) {
      req.app.get('io').emit('tripCreated', populatedTrip || trip);
    }

    res.status(201).json({ success: true, trip: populatedTrip || trip });
  } catch (error) {
    console.error("Create Trip Error:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getMyTripById = async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await Trip.findOne({ _id: tripId, creator_id: req.user.userId });
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    res.json({ success: true, trip: { ...trip.toObject(), image: trip.image || '' } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const updateTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { destination, start_date, end_date, budget, description, interests, image } = req.body;

    if (!destination || !start_date || !end_date || !budget || !description) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    const existingTrip = await Trip.findOne({ _id: tripId, creator_id: req.user.userId });
    if (!existingTrip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const { startDate, endDate, error } = validateTripDates(start_date, end_date);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    existingTrip.destination = destination;
    existingTrip.start_date = startDate;
    existingTrip.end_date = endDate;
    existingTrip.budget = budget;
    existingTrip.description = description;
    existingTrip.interests = Array.isArray(interests) ? interests : existingTrip.interests;
    existingTrip.image = typeof image === 'string' ? image : existingTrip.image || '';

    await existingTrip.save();

    res.json({ success: true, trip: { ...existingTrip.toObject(), image: existingTrip.image || '' } });
  } catch (error) {
    console.error('Update Trip Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const listMyTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ creator_id: req.user.userId }).sort({ created_at: -1 });
    res.json({
      success: true,
      trips: trips.map((trip) => ({
        ...trip.toObject(),
        image: trip.image || ''
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const discoverTrips = async (req, res) => {
  try {
    const { q = '', startMonth, maxDays } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Auto-mark expired trips as completed, but keep them in the database for admin/history.
    await Trip.updateMany(
      { end_date: { $lt: today }, status: { $ne: 'completed' } },
      { $set: { status: 'completed' } }
    );

    const filter = {
      end_date: { $gte: today },
      status: { $ne: 'completed' }
    };
    if (q && q.trim().length > 0) {
      filter.destination = { $regex: q.trim(), $options: 'i' };
    }
    // Month filter by start_date month if provided (e.g., 'May' or '05')
    if (startMonth) {
      const month = isNaN(Number(startMonth)) 
        ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(startMonth) 
        : Number(startMonth) - 1;
      if (month >= 0) {
        const year = new Date().getFullYear();
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 1);
        filter.start_date = { $gte: start, $lt: end };
      }
    }
    // fetch all matching trips (no arbitrary limit so users see every trip in the database)
    let trips = await Trip.find(filter).populate('creator_id', 'name email profilePicture').sort({ start_date: 1 });
    if (maxDays) {
      const md = Number(maxDays);
      if (!isNaN(md) && md > 0) {
        trips = trips.filter(t => {
          const days = Math.ceil((new Date(t.end_date) - new Date(t.start_date)) / (1000*60*60*24));
          return days <= md;
        });
      }
    }
    const items = trips.map(t => ({
      id: t._id,
      title: `${t.destination} Trip`,
      destination: t.destination,
      start_date: t.start_date,
      end_date: t.end_date,
      budget: t.budget,
      description: t.description,
      image: t.image || '',
      interests: t.interests,
      durationDays: Math.max(1, Math.ceil((new Date(t.end_date) - new Date(t.start_date)) / (1000*60*60*24))),
      status: t.status,
      creator_id: t.creator_id,
      participants: t.participants || [],
    }));
    res.json({ success: true, items });
  } catch (error) {
    console.error("Discover Trips Error:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
