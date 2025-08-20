import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, onValue, update, remove, serverTimestamp } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
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
    const requestWithId = {
      ...request,
      id: newRequestRef.key!,
      createdAt: serverTimestamp(),
      lastModified: serverTimestamp()
    };
    await update(newRequestRef, requestWithId);
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
      lastModified: serverTimestamp()
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
        const timeA = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : a.createdAt as number;
        const timeB = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : b.createdAt as number;
        return timeB - timeA;
      });
      callback(requests);
    } else {
      callback([]);
    }
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