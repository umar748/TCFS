import Request from '../models/Request.js';
import Trip from '../models/Trip.js';
import Chat from '../models/Chat.js';
import Notification from '../models/Notification.js';

export const sendJoinRequest = async (req, res) => {
  try {
    const { trip_id, message } = req.body;
    const from_user_id = req.user.userId;

    const trip = await Trip.findById(trip_id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    if (trip.creator_id.toString() === from_user_id) {
      return res.status(400).json({ success: false, message: 'You cannot join your own trip' });
    }

    const existingRequest = await Request.findOne({ trip_id, from_user_id });
    if (existingRequest) {
      if (existingRequest.status === 'rejected') {
        await Request.findByIdAndDelete(existingRequest._id);
      } else {
        const existingMessage = existingRequest.status === 'accepted'
          ? 'Your join request was already accepted'
          : 'Request already sent';
        return res.status(400).json({ success: false, message: existingMessage, status: existingRequest.status });
      }
    }

    const request = await Request.create({
      trip_id,
      from_user_id,
      to_user_id: trip.creator_id,
      message,
      status: 'pending'
    });

    const populatedRequest = await Request.findById(request._id)
      .populate('from_user_id', 'name email profilePicture')
      .populate('trip_id', 'destination start_date end_date');

    // Create notification in DB
    const notification = await Notification.create({
      userId: trip.creator_id,
      fromUserId: from_user_id,
      type: 'Trip Request',
      message: `${req.user.name} requested to join your trip to ${trip.destination}`
    });

    // Notify trip creator via socket
    const io = req.app.get('io');
    if (io) {
      io.to(trip.creator_id.toString()).emit('newNotification', {
        ...notification.toObject(),
        _id: notification._id
      });
      
      // Also emit requestSent for compatibility
      io.to(trip.creator_id.toString()).emit('requestSent', {
        request: populatedRequest || request,
        trip_title: trip.destination,
        from_user_name: req.user.name
      });
    }

    res.status(201).json({ success: true, request: populatedRequest || request });
  } catch (error) {
    console.error("Send Request Error:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const handleRequestAction = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // 'accepted' or 'rejected'
    const userId = req.user.userId;

    const request = await Request.findById(requestId).populate('trip_id');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.to_user_id.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (action === 'accepted') {
      request.status = 'accepted';
      await request.save();

      // Add to trip participants
      await Trip.findByIdAndUpdate(request.trip_id, {
        $addToSet: { participants: request.from_user_id }
      });

      // Create Chat room
      let chat = await Chat.findOne({ trip_id: request.trip_id });
      if (!chat) {
        chat = await Chat.create({
          trip_id: request.trip_id,
          users: [request.from_user_id, request.to_user_id]
        });
      } else {
        await Chat.findByIdAndUpdate(chat._id, {
          $addToSet: { users: request.from_user_id }
        });
      }

      // Create notification in DB
      const acceptanceNotification = await Notification.create({
        userId: request.from_user_id,
        fromUserId: userId,
        type: 'Trip Request',
        message: `Your request to join the trip to ${request.trip_id.destination} has been accepted!`
      });

      // Notify requesting user
      const io = req.app.get('io');
      if (io) {
        io.to(request.from_user_id.toString()).emit('newNotification', {
          ...acceptanceNotification.toObject(),
          _id: acceptanceNotification._id
        });
        
        // Also emit requestAccepted for UI updates
        io.to(request.from_user_id.toString()).emit('requestAccepted', {
          trip_id: request.trip_id._id,
          trip_title: request.trip_id.destination,
          chat_id: chat._id
        });
      }
    } else if (action === 'rejected') {
      request.status = 'rejected';
      await request.save();

      // Create notification in DB
      const rejectionNotification = await Notification.create({
        userId: request.from_user_id,
        fromUserId: userId,
        type: 'Trip Request',
        message: `Your request to join the trip to ${request.trip_id.destination} has been rejected.`
      });

      // Notify requesting user
      const io = req.app.get('io');
      if (io) {
        io.to(request.from_user_id.toString()).emit('newNotification', {
          ...rejectionNotification.toObject(),
          _id: rejectionNotification._id
        });
        
        // Also emit requestRejected for UI updates
        io.to(request.from_user_id.toString()).emit('requestRejected', {
          trip_id: request.trip_id._id,
          trip_title: request.trip_id.destination
        });
      }
    }

    const responsePayload = { success: true, message: `Request ${action}` };
    if (action === 'accepted') {
      responsePayload.chat_id = String(await Chat.findOne({ trip_id: request.trip_id }).then(c => c?._id));
      responsePayload.trip_id = String(request.trip_id._id);
    }
    res.json(responsePayload);
  } catch (error) {
    console.error("Handle Request Error:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getMyIncomingRequests = async (req, res) => {
  try {
    const requests = await Request.find({ to_user_id: req.user.userId })
      .populate('from_user_id', 'name email profilePicture')
      .populate('trip_id', 'destination start_date end_date')
      .sort({ created_at: -1 });
    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getMyOutgoingRequests = async (req, res) => {
  try {
    const requests = await Request.find({ from_user_id: req.user.userId })
      .select('trip_id status created_at')
      .sort({ created_at: -1 });
    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const deleteRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId;
    const reqDoc = await Request.findById(requestId);
    if (!reqDoc) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    if (reqDoc.to_user_id.toString() !== userId && reqDoc.from_user_id.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    await Request.findByIdAndDelete(requestId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
