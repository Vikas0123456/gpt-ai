import React, { useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';

export const CallDebugger: React.FC = () => {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testCall = () => {
    if (!socket || !user) {
      addLog('❌ No socket or user');
      return;
    }

    addLog('🚀 Testing call functionality...');
    
    // Test room joining
    socket.emit('join-rooms', ['test-room-123']);
    addLog('📡 Emitted join-rooms');
    
    // Test call initiation
    setTimeout(() => {
      socket.emit('initiate-video-call', {
        roomId: 'test-room-123',
        callType: 'video'
      });
      addLog('📞 Emitted initiate-video-call');
    }, 1000);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg max-w-md max-h-96 overflow-y-auto z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Call Debugger</h3>
        <button 
          onClick={clearLogs}
          className="text-xs bg-red-600 px-2 py-1 rounded"
        >
          Clear
        </button>
      </div>
      
      <div className="mb-2">
        <div className="text-xs">
          Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
        <div className="text-xs">
          User: {user?.id || 'Not logged in'}
        </div>
      </div>
      
      <button 
        onClick={testCall}
        className="w-full bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm mb-2"
      >
        Test Call
      </button>
      
      <div className="text-xs space-y-1 max-h-48 overflow-y-auto">
        {logs.map((log, index) => (
          <div key={index} className="text-gray-300">{log}</div>
        ))}
      </div>
    </div>
  );
};
