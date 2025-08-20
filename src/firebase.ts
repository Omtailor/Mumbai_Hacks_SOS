import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, onValue, update, remove, serverTimestamp } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCasrxOLPq_UzCWdfo2rF15xAWgKSGCqhQ",
    authDomain: "mumbaihacks-98c94.firebaseapp.com",
    databaseURL: "https://mumbaihacks-98c94-default-rtdb.firebaseio.com",
    projectId: "mumbaihacks-98c94",
    storageBucket: "mumbaihacks-98c94.firebasestorage.app",
    messagingSenderId: "409646664922",
    appId: "1:409646664922:web:6cc43debdef1ec91a6e9e3",
    measurementId: "G-7DW2C92SEF"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

// Database references
export const sosRequestsRef = ref(database, 'sosRequests');

export interface SOSRequest {
  id: string;
  name: string;
  age: number;
  phone: string;
  message: string;
  coords: string;
  createdAt: string;
  lastModified: number;
  resolved: boolean;
  resolvedAt: string | null;
  priority: 'critical' | 'high' | 'medium' | 'low' | 'minimal' | 'spam';
  category: 'medical' | 'food' | 'shelter' | 'trapped' | 'other';
  priorityScore: number;
  reasoning: string;
}

// Add new SOS request
export const addSOSRequest = async (request: Omit<SOSRequest, 'id'>) => {
  try {
    const newRequestRef = push(sosRequestsRef);
    const requestWithTimestamp = {
      ...request,
      id: newRequestRef.key!,
      createdAt: new Date().toISOString(), // Use ISO string for consistency
      lastModified: Date.now()
    };
    await update(newRequestRef, requestWithTimestamp);
    return newRequestRef.key;
  } catch (error) {
    console.error('Error adding SOS request:', error);
    throw error;
  }
};

// Update SOS request
export const updateSOSRequest = async (id: string, updates: Partial<SOSRequest>) => {
  try {
    const requestRef = ref(database, `sosRequests/${id}`);
    await update(requestRef, {
      ...updates,
      lastModified: Date.now()
    });
  } catch (error) {
    console.error('Error updating SOS request:', error);
    throw error;
  }
};

// Delete SOS request
export const deleteSOSRequest = async (id: string) => {
  try {
    const requestRef = ref(database, `sosRequests/${id}`);
    await remove(requestRef);
  } catch (error) {
    console.error('Error deleting SOS request:', error);
    throw error;
  }
};

// Listen to real-time updates
export const subscribeToSOSRequests = (callback: (requests: SOSRequest[]) => void) => {
  return onValue(sosRequestsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const requests = Object.values(data) as SOSRequest[];
      // Sort by creation time (newest first)
      requests.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA;
      });
      callback(requests);
    } else {
      callback([]);
    }
  }, (error) => {
    console.error('Firebase subscription error:', error);
    // Fallback to empty array on error
    callback([]);
  });
};

// Clear all requests (admin function)
export const clearAllRequests = async () => {
  try {
    await remove(sosRequestsRef);
  } catch (error) {
    console.error('Error clearing all requests:', error);
    throw error;
  }
};
