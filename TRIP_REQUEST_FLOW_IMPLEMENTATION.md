# Trip Request Flow Implementation

## Overview
This document outlines the complete implementation of the trip request flow where new users can request to join already created trips from the search page, and the requests are properly tracked and notified.

## User Flow

### 1. User Searches for Trips (Search Page)
**File:** `tcfs-frontend/src/pages/Search/SearchPage.jsx`

- User navigates to Search page and selects "Find Trips" tab
- User filters trips by destination, dates, and budget
- User clicks on a trip card to view details

### 2. View Trip Details & Send Request
**File:** `tcfs-frontend/src/pages/Search/SearchPage.jsx`

When a user clicks on a trip card:
- A modal opens showing trip details:
  - Trip destination and dates
  - Budget and number of participants
  - Trip description and interests
  - Message input field for the requester to explain why they want to join

- User enters a message and clicks "Send Request"
- Frontend makes POST request to `/api/requests/send` with:
  ```json
  {
    "trip_id": "trip-id",
    "message": "user's message"
  }
  ```

### 3. Request Creation in Backend
**File:** `backend/controllers/requestController.js` - `sendJoinRequest` function

When a request is sent:

**Step 1: Validation**
- Verify trip exists
- Prevent trip creator from requesting their own trip
- Check if request already exists

**Step 2: Create Request in Database**
- Create request document with:
  - `trip_id`: ID of the trip
  - `from_user_id`: Current user's ID
  - `to_user_id`: Trip creator's ID
  - `message`: User's message
  - `status`: Set to 'pending'

**Step 3: Create Notification in Database**
- Create notification document with:
  - `userId`: Trip creator's ID
  - `fromUserId`: Requesting user's ID
  - `type`: 'Trip Request'
  - `message`: "{UserName} requested to join your trip to {Destination}"

**Step 4: Real-time Socket Notification**
- Emit 'newNotification' event to trip creator via socket.io
- Emit 'requestSent' event for compatibility with other components

**Response:** 
```json
{
  "success": true,
  "request": { request object }
}
```

### 4. Trip Creator Receives Request
**File:** `tcfs-frontend/src/pages/Requests/RequestsPage.jsx`

The trip creator sees the request in two places:

**A. Request Page**
- Fetches incoming requests from `/api/requests/incoming`
- Displays:
  - Sender's name, age, gender, profile picture
  - Trip details (destination, dates)
  - Request message
  - Action buttons: Accept/Reject/Delete
  - Shows pending, accepted, and rejected requests

**B. Notifications Page**
**File:** `tcfs-frontend/src/pages/Dashboard/Notifications.jsx`

- Receives real-time notifications via socket.io 'newNotification' event
- Displays notification in the notification center
- User can:
  - Mark as read
  - Navigate to related request
  - See notification timestamp

### 5. Trip Creator Actions
**File:** `backend/controllers/requestController.js` - `handleRequestAction` function

**Accept Request:**

Step 1: Update request status to 'accepted'
Step 2: Add requesting user to trip participants
Step 3: Create/update chat room for the trip
Step 4: Create notification for requesting user
Step 5: Emit socket events:
  - 'newNotification' for the notification
  - 'requestAccepted' for UI update

**Response includes:**
```json
{
  "success": true,
  "chat_id": "chat-id",
  "trip_id": "trip-id"
}
```

**Reject Request:**

Step 1: Update request status to 'rejected'
Step 2: Create notification for requesting user
Step 3: Emit socket events:
  - 'newNotification' for notification
  - 'requestRejected' for UI update

## Database Models Involved

### Request Model
```javascript
{
  trip_id: ObjectId,           // Reference to Trip
  from_user_id: ObjectId,      // User requesting
  to_user_id: ObjectId,        // Trip creator
  message: String,             // Request message
  status: String,              // 'pending', 'accepted', 'rejected'
  created_at: Date
}
```

### Notification Model
```javascript
{
  userId: ObjectId,            // Who receives notification
  fromUserId: ObjectId,        // Who sent the action
  type: String,                // 'Trip Request'
  message: String,             // Notification message
  read: Boolean,               // Read status
  createdAt: Date
}
```

## API Endpoints

### Send Request
- **POST** `/api/requests/send`
- **Auth:** Required (Bearer token)
- **Body:**
  ```json
  {
    "trip_id": "string",
    "message": "string"
  }
  ```

### Get Incoming Requests
- **GET** `/api/requests/incoming`
- **Auth:** Required
- **Returns:** Array of requests to_user_id matches current user

### Handle Request Action
- **PUT** `/api/requests/{requestId}/action`
- **Auth:** Required
- **Body:**
  ```json
  {
    "action": "accepted|rejected"
  }
  ```

### List Notifications
- **GET** `/api/notifications`
- **Auth:** Required
- **Returns:** Array of notifications for current user

## Socket.IO Events

### Client → Server
- `join userId`: User joins their notification room

### Server → Client (Notifications)
- `newNotification notification`: New notification created
- `notificationUpdated notification`: Notification updated (read status)

### Server → Client (Requests)
- `requestSent data`: Request sent (for trip creator)
- `requestAccepted data`: Request accepted (for requester)
- `requestRejected data`: Request rejected (for requester)

## Components & Pages Updated

### Frontend Changes
1. **SearchPage.jsx** - Added trip details modal with request form
2. **Socket.js** - Uses existing socket connection

### Backend Changes
1. **requestController.js** - Enhanced with proper socket notifications
2. **Server setup** - Already configured to use socket.io

## Testing Checklist

- [ ] User A logs in and creates a trip
- [ ] User B logs in and searches for trips
- [ ] User B clicks on User A's trip
- [ ] User B sees trip details modal with message input
- [ ] User B enters a message and clicks "Send Request"
- [ ] User B sees success message
- [ ] User A receives notification (real-time via socket)
- [ ] User A sees request in Requests page
- [ ] User A sees notification in Notifications page
- [ ] User A accepts request
- [ ] User B receives acceptance notification
- [ ] User B is added to trip participants
- [ ] Chat is created for the trip
- [ ] User A rejects another request
- [ ] User B from rejected request sees rejection notification

## Error Handling

- Trip not found: Returns 404
- User trying to request their own trip: Returns 400
- Request already sent: Returns 400 (prevents duplicates)
- Unauthorized request action: Returns 403
- Missing message: Frontend validation shows alert
- Network errors: Frontend catch block shows error message

## Future Enhancements

1. Add request message preview in Requests page
2. Add ability to customize request acceptance message
3. Add request expiration (auto-reject after X days)
4. Add bulk request management for trip creators
5. Add request history/archive
6. Add ability to send counter-proposals
