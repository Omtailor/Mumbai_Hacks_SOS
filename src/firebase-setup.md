# Firebase Setup Instructions

To enable real-time synchronization, you need to set up Firebase:

## 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "sos-link-emergency")
4. Enable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Realtime Database
1. In your Firebase project, go to "Realtime Database"
2. Click "Create Database"
3. Choose location (closest to your users)
4. Start in **test mode** for now (we'll secure it later)
5. Click "Done"

## 3. Get Configuration
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon (</>) to add web app
4. Enter app name (e.g., "SOS Link Web")
5. Copy the configuration object

## 4. Update Firebase Config
Replace the configuration in `src/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## 5. Security Rules (Important!)
In Firebase Console > Realtime Database > Rules, replace with:

```json
{
  "rules": {
    "sosRequests": {
      ".read": true,
      ".write": true,
      "$requestId": {
        ".validate": "newData.hasChildren(['name', 'age', 'phone', 'message', 'coords', 'priority', 'category'])"
      }
    },
    "connections": {
      ".read": true,
      ".write": true
    }
  }
}
```

## 6. Test the Setup
1. Save your changes
2. Restart the development server
3. Submit a test SOS request
4. Check Firebase Console > Realtime Database to see the data
5. Open the app in multiple browser tabs to test real-time sync

## Features Enabled:
- ✅ Real-time synchronization across all devices
- ✅ Offline support with automatic sync
- ✅ Live connection status
- ✅ Instant notifications for new SOS requests
- ✅ AI-powered prioritization
- ✅ Cross-device rescuer coordination

## Production Considerations:
- Implement proper authentication
- Add more restrictive security rules
- Set up monitoring and alerts
- Consider Firebase Functions for advanced features