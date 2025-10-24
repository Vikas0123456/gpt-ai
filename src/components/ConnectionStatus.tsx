import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected }) => {
  return (
    <div className={`fixed top-4 right-4 z-30 flex items-center space-x-2 px-2 py-1 rounded-full transition-colors ${
      isConnected 
        ? 'bg-green-600 text-white' 
        : 'bg-red-600 text-white'
    }`}>
      {isConnected ? (
        <Wifi className="w-3 h-3" />
      ) : (
        <WifiOff className="w-3 h-3" />
      )}
      <span className="text-xs font-medium">
        {isConnected ? 'Online' : 'Offline'}
      </span>
    </div>
  );
};
