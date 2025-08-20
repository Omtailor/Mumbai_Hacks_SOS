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
    if (!isOnline) return;

    // Create a unique connection reference
    const connectionId = `connection_${Date.now()}_${Math.random()}`;
    const myConnectionRef = ref(database, `connections/${connectionId}`);
    const connectionsRef = ref(database, 'connections');

    // Set this connection as active
    set(myConnectionRef, {
      timestamp: Date.now(),
      userAgent: navigator.userAgent.substring(0, 100)
    });

    // Remove this connection when user disconnects
    onDisconnect(myConnectionRef).remove();

    // Listen to all connections
    const unsubscribe = onValue(connectionsRef, (snapshot) => {
      const connections = snapshot.val();
      const count = connections ? Object.keys(connections).length : 0;
      setConnectedUsers(count);
    });

    return () => {
      unsubscribe();
      set(myConnectionRef, null); // Clean up on unmount
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