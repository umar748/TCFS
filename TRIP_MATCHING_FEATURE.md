# Trip Matching Feature Implementation

## Overview
Implemented an automatic trip matching system that notifies users about relevant trips when they complete their profile.

**When it triggers:**
- After user completes/updates their profile
- Automatically finds trips that match their interests, budget, and location preferences
- Sends real-time notifications to the user

---

## How It Works

### 1. **Matching Algorithm**
The system calculates a compatibility score for each trip:

```
Matching Criteria:
├─ Shared Interests (40 points max)
│  └─ +15 points per matching interest (up to 3)
├─ Budget Compatibility (30 points)
│  ├─ +30 if trip budget ≤ user budget
│  ├─ +15 if trip slightly over budget (max 50% overage)
│  └─ 0 if significantly over budget
└─ Destination/Location Match (25 points)
   └─ +25 if trip destination matches user's location preference

Minimum Score Required: 20 points
Results: Top 10 matching trips
```

### 2. **Profile Completion Flow**

```
User Signup/Login
        ↓
User fills/updates profile
- Name, email, interests, budget
- Age, gender, location
- Travel style, bio
        ↓
updateProfile() endpoint called
        ↓
Profile saved to database
        ↓
sendTripMatchNotifications() triggered
        ↓
System searches for matching trips
        ↓
Real-time notifications sent via Socket.io
        ↓
Notifications stored in database
```

### 3. **Notification Details**
Each notification includes:
- Trip destination
- Trip budget
- Creator name
- Match reasons (why it was matched)
- Trip ID and start/end dates
- Trip interests and image

---

## Code Implementation

### Backend Files Modified

#### 1. **User Model** (`backend/models/User.js`)
```javascript
// Added to userSchema:
budget: {
  type: Number,
  default: 0,
  description: 'User\'s travel budget in PKR'
}
```

**Profile Completion Points:**
- Name: 10 points
- Email: 10 points  
- Profile Picture: 10 points
- Bio: 10 points
- Age: 10 points
- Gender: 10 points
- Interests: 10 points
- Travel Style: 10 points
- Location: 10 points
- Budget: 10 points (when > 0)
- **Total: 100 points**

---

#### 2. **Matching Service** (`backend/services/matchingService.js`)

**New Functions:**

##### `findMatchingTrips(user)`
Finds the best matching trips for a user
```javascript
// Returns array of matching trips with:
- tripId, destination, budget
- startDate, endDate, description
- matchScore, matchReasons
- creatorName, interests
```

##### `sendTripMatchNotifications(userId, io)`
Sends notifications for all matching trips
```javascript
// Parameters:
- userId: User ID to send notifications for
- io: Socket.io instance for real-time notification

// Features:
- Prevents duplicate notifications
- Sends max 10 notifications
- Real-time Socket.io emission
- Database persistence
```

---

#### 3. **User Controller** (`backend/controllers/userController.js`)

**Updated `updateProfile()` endpoint**

```javascript
// Now accepts:
{
  name, bio, age, gender, interests,
  travelStyle, location, profilePicture,
  budget  // NEW
}

// Triggers:
1. Saves profile to database
2. Calculates profile completion %
3. Calls sendTripMatchNotifications()
4. Returns updated user with budget

// Response:
{
  success: true,
  message: 'Profile updated successfully',
  user: {
    id, name, email, bio,
    age, gender, interests, travelStyle,
    location, budget,  // NEW
    profileCompletion
  }
}
```

---

## API Endpoints

### Update Profile (Existing - Now Enhanced)
**POST** `/api/user/update-profile`

**Request:**
```json
{
  "name": "John Doe",
  "age": 25,
  "gender": "Male",
  "interests": ["hiking", "beaches", "food"],
  "travelStyle": "adventure",
  "location": "Karachi",
  "bio": "Love traveling and meeting new people",
  "budget": 50000,
  "profilePicture": "url/to/image"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "age": 25,
    "gender": "Male",
    "interests": ["hiking", "beaches", "food"],
    "travelStyle": "adventure",
    "location": "Karachi",
    "budget": 50000,
    "profileCompletion": 100,
    "profilePicture": "url/to/image",
    "bio": "Love traveling and meeting new people"
  }
}
```

### Get Notifications (Existing - Shows Trip Matches)
**GET** `/api/notifications`

**Response includes Trip Request notifications:**
```json
{
  "success": true,
  "items": [
    {
      "_id": "notification_id",
      "userId": "user_id",
      "tripId": "trip_id",
      "type": "Trip Request",
      "message": "We found a matching trip to Northern Areas by Ahmed Khan! Reason: Shared interests: hiking, adventure Budget: PKR 45000",
      "read": false,
      "createdAt": "2024-05-10T10:30:00Z"
    }
  ]
}
```

---

## Real-Time Socket Events

### Server to Client
**Event:** `newNotification`

When a trip match is found, server emits:
```javascript
socket.emit('newNotification', {
  _id: notification_id,
  userId: user_id,
  tripId: trip_id,
  type: 'Trip Request',
  message: notification_message,
  read: false,
  createdAt: timestamp
})
```

**Frontend Implementation Example:**
```javascript
// In your React component
useEffect(() => {
  socket.on('newNotification', (notification) => {
    console.log('New trip match found:', notification.message);
    // Show toast/alert to user
    // Update notifications list
  });
}, []);
```

---

## Database Schema

### Trip Match Notification
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  tripId: ObjectId (ref: Trip),
  type: 'Trip Request',
  message: String,  // "We found a matching trip to..."
  read: Boolean,    // false by default
  createdAt: Date
}
```

---

## Testing the Feature

### 1. **Manual Test Flow**

```bash
# 1. Register a new user
POST /api/auth/register
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "TestPass123!"
}

# 2. Complete profile with interests and budget
POST /api/user/update-profile
{
  "interests": ["hiking", "beaches"],
  "budget": 50000,
  "location": "Karachi",
  "travelStyle": "adventure"
}

# 3. Check notifications (should have trip matches)
GET /api/notifications

# 4. Verify Socket.io receives notification
# Connect to Socket.io and listen for 'newNotification' event
```

### 2. **What to Verify**

- [ ] User can update profile with budget
- [ ] Profile completion % reaches 100 when all fields filled
- [ ] Trip matching notifications appear after profile update
- [ ] Multiple matching trips get multiple notifications
- [ ] No duplicate notifications for same trip
- [ ] Real-time Socket.io notifications arrive
- [ ] Notifications visible in GET /api/notifications
- [ ] Match reasons are displayed correctly

---

## Important Notes

### Duplicate Prevention
- System checks for existing unread notification before creating new one
- If notification already exists for same trip, it's skipped
- User won't get spammed with duplicate notifications

### Performance
- Matches top 10 trips only (configurable in code)
- Runs asynchronously after profile update
- Does not block profile save response

### Matching Exclusions
- Excludes trips created by the user themselves
- Only includes upcoming trips (start_date >= now)
- Excludes trips from blocked users (if implemented)

---

## Future Enhancements

1. **Scheduled Matching**
   - Run matching job daily for all active users
   - Find new trips for users with complete profiles

2. **Match Score Calculation**
   - Add travel duration preference matching
   - Add group size preference
   - Add accommodation type preference

3. **User Preferences**
   - Allow users to configure match notifications frequency
   - Allow filtering by trip length, group size, etc.

4. **Analytics**
   - Track which matches convert to trip requests
   - Improve algorithm based on user feedback

5. **Email Notifications**
   - Send email along with in-app notification
   - Daily digest of matching trips

---

## Troubleshooting

### Notifications Not Appearing

1. **Check profile completion:**
   ```bash
   GET /api/user/profile
   # Verify budget and interests are set
   ```

2. **Check if trips exist:**
   ```bash
   GET /api/trips
   # Verify upcoming trips in database
   ```

3. **Check notification creation logs:**
   - Look for errors in server logs
   - Verify Socket.io connection active

### No Matching Trips Found

- Verify user has interests set
- Verify user has budget > 0
- Verify upcoming trips exist with matching interests
- Check if trip budgets are below user budget

### Duplicate Notifications

- Check database for existing notifications
- Verify unique constraint is working
- Clear and re-test

---

## Summary

This feature automatically connects users with relevant trips when they complete their profiles, improving user engagement and trip discovery. The matching algorithm considers interests, budget, and location to provide personalized recommendations with real-time notifications.
