import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, onDisconnect, set, onValue } from 'firebase/database';

interface ConnectionStatusProps {
  isOnline: boolean;
  syncInProgress: boolean;
  queuedRequests: number;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  isOnline, 
  syncInProgress, 
  queuedRequests 
}) => {
  const [connectedUsers, setConnectedUsers] = useState(0);

  useEffect(() => {
    if (!isOnline) {
      setConnectedUsers(0);
      return;
    }

    // Create a unique connection reference
    const connectionId = `connection_${Date.now()}_${Math.random()}`;
    const myConnectionRef = ref(database, `connections/${connectionId}`);
    const connectionsRef = ref(database, 'connections');

    const setupConnection = async () => {
      try {
        // Set this connection as active
        await set(myConnectionRef, {
          timestamp: Date.now(),
          userAgent: navigator.userAgent.substring(0, 100)
        });

        // Remove this connection when user disconnects
        await onDisconnect(myConnectionRef).remove();
        
        console.log('Connection established:', connectionId);
      } catch (error) {
        console.error('Error setting up connection:', error);
      }
    };

    setupConnection();

    // Listen to all connections
    const unsubscribe = onValue(connectionsRef, (snapshot) => {
      const connections = snapshot.val();
      const count = connections ? Object.keys(connections).length : 0;
      console.log('Connected devices:', count);
      setConnectedUsers(count);
    }, (error) => {
      console.error('Connection monitoring error:', error);
      setConnectedUsers(0);
    });
    return () => {
      unsubscribe();
      // Clean up on unmount
      set(myConnectionRef, null).catch(console.error);
    };
  }, [isOnline]);

  const getStatusText = () => {
    if (syncInProgress) return '🔄 Syncing...';
    if (!isOnline) return `🔴 Offline${queuedRequests > 0 ? ` (${queuedRequests} queued)` : ''}`;
    return `🟢 Online${connectedUsers > 1 ? ` • ${connectedUsers} devices connected` : ''}`;
  };

  const getStatusClass = () => {
    if (syncInProgress) return 'connection-status syncing';
    if (!isOnline) return 'connection-status offline';
    return 'connection-status online';
  };

  return (
    <div className={getStatusClass()}>
      {getStatusText()}
    </div>
  );
};

export default ConnectionStatus;