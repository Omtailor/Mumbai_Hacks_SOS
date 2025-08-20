import React, { useState, useEffect } from 'react';
import VictimPortal from './components/VictimPortal';
import RescuerPortal from './components/RescuerPortal';
import ConnectionStatus from './components/ConnectionStatus';
import { addSOSRequest } from './firebase';
import { loadQueue, saveQueue, addToQueue, clearQueue, getQueueLength, QueuedRequest } from './utils/offlineQueue';

function App() {
  const [activeTab, setActiveTab] = useState<'victim' | 'rescuer'>('victim');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [queuedRequests, setQueuedRequests] = useState<QueuedRequest[]>([]);

  useEffect(() => {
    // Load queued requests on startup
    setQueuedRequests(loadQueue());

    // Connection event listeners
    const handleOnline = () => {
      setIsOnline(true);
      syncQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic sync check
    const syncInterval = setInterval(() => {
      if (isOnline && queuedRequests.length > 0) {
        syncQueue();
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, [queuedRequests.length]);

  const syncQueue = async () => {
    if (syncInProgress || queuedRequests.length === 0 || !isOnline) return;

    setSyncInProgress(true);

    try {
      const queue = loadQueue();
      const processed: string[] = [];

      for (const queuedRequest of queue) {
        try {
          await addSOSRequest(queuedRequest);
          processed.push(queuedRequest.id);
        } catch (error) {
          console.error('Error syncing request:', error);
          break; // Stop on first error to preserve order
        }
      }

      if (processed.length > 0) {
        // Remove successfully synced requests from queue
        const remainingQueue = queue.filter(req => !processed.includes(req.id));
        saveQueue(remainingQueue);
        setQueuedRequests(remainingQueue);

        // Show success notification
        if (processed.length === queue.length) {
          alert(`✅ ${processed.length} queued request${processed.length > 1 ? 's' : ''} synced successfully!`);
        } else {
          alert(`✅ ${processed.length} of ${queue.length} requests synced. Remaining will retry automatically.`);
        }
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncInProgress(false);
    }
  };

  const handleRequestQueued = (request: any) => {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: `queued_${Date.now()}_${Math.random()}`
    };
    
    addToQueue(queuedRequest);
    setQueuedRequests(loadQueue());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <ConnectionStatus 
        isOnline={isOnline} 
        syncInProgress={syncInProgress} 
        queuedRequests={queuedRequests.length}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-slate-900/80 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg">
              🚨
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">SOS Link</h1>
              <p className="text-slate-400 text-sm">AI-Powered Emergency Response • Real-time Firebase Sync</p>
            </div>
          </div>

          <nav className="flex gap-2">
            <button
              onClick={() => setActiveTab('victim')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'victim'
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600'
              }`}
            >
              Victim Portal
            </button>
            <button
              onClick={() => setActiveTab('rescuer')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'rescuer'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600'
              }`}
            >
              Rescuer Portal
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {activeTab === 'victim' ? (
          <VictimPortal 
            isOnline={isOnline} 
            onRequestQueued={handleRequestQueued}
          />
        ) : (
          <RescuerPortal />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 px-6 py-4">
        <div className="text-center text-slate-400 text-sm">
          SOS requests are analyzed by AI and synchronized in real-time across all devices using Firebase. 
          Works offline with automatic sync when connection returns.
        </div>
      </footer>
    </div>
  );
}

export default App;