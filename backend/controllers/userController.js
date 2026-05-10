import User from '../models/User.js';

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, bio, age, gender, interests, travelStyle, location, profilePicture } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (age !== undefined) user.age = age;
    if (gender !== undefined) user.gender = gender;
    if (interests !== undefined) user.interests = interests;
    if (travelStyle !== undefined) user.travelStyle = travelStyle;
    if (location !== undefined) user.location = location;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();

    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        age: user.age,
        gender: user.gender,
        interests: user.interests,
        travelStyle: user.travelStyle,
        location: user.location,
        profileCompletion: user.profileCompletion
      }
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { q = '', minAge, maxAge, gender, interests } = req.query;
    const text = (q || '').trim();
    const filter = { isBlocked: false };

    if (text) {
      const regex = { $regex: text, $options: 'i' };
      filter.$or = [
        { name: regex },
        { location: regex },
        { bio: regex },
        { interests: regex }
      ];
    }

    const minA = Number(minAge);
    const maxA = Number(maxAge);
    if (!isNaN(minA) || !isNaN(maxA)) {
      filter.age = {};
      if (!isNaN(minA)) filter.age.$gte = minA;
      if (!isNaN(maxA)) filter.age.$lte = maxA;
    }

    if (gender && gender !== 'Any') {
      filter.gender = gender;
    }

    if (interests) {
      const arr = String(interests)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      if (arr.length) {
        filter.interests = { $in: arr };
      }
    }

    const users = await User.find(filter)
      .select('name email profilePicture bio age gender interests travelStyle location verificationStatus profileCompletion createdAt')
      .limit(100);
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('blockedUsers').populate('blockedUsers', 'name email profilePicture');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, blocked: user.blockedUsers || [] });
  } catch (error) {
    console.error("Get Blocked Users Error:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const blockUser = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { id: targetId } = req.params;

    if (currentUserId === targetId) {
      return res.status(400).json({ success: false, message: 'You cannot block yourself' });
    }

    const user = await User.findById(currentUserId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.blockedUsers) user.blockedUsers = [];
    const already = user.blockedUsers.some(u => u.toString() === targetId);
    if (!already) {
      user.blockedUsers.push(targetId);
      await user.save();
    }
    res.json({ success: true, message: 'User blocked', blockedUsers: user.blockedUsers });
  } catch (error) {
    console.error("Block User Error:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { id: targetId } = req.params;

    const user = await User.findById(currentUserId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.blockedUsers = (user.blockedUsers || []).filter(u => u.toString() !== targetId);
    await user.save();
    res.json({ success: true, message: 'User unblocked', blockedUsers: user.blockedUsers });
  } catch (error) {
    console.error("Unblock User Error:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
