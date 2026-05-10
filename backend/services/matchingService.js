import User from '../models/User.js';

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
