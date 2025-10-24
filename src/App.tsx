import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthForm } from './components/Auth/AuthForm';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ChatRoom } from './components/Chat/ChatRoom';
import { CallNotification } from './components/VideoCall/CallNotification';
import { VideoCall } from './components/VideoCall/VideoCall';
import { ConnectionStatus } from './components/ConnectionStatus';
// import { CallDebugger } from './components/Debug/CallDebugger';
// import { TestCallButton } from './components/TestCallButton';
import { useSocket } from './hooks/useSocket';
import { Menu } from 'lucide-react';

interface User {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  isOnline: boolean;
  lastSeen: string;
}

const ChatApp: React.FC = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Call notification state
  const [incomingCall, setIncomingCall] = useState<{
    isVisible: boolean;
    caller: User | null;
    callType: 'audio' | 'video';
    callId: string | null;
  }>({
    isVisible: false,
    caller: null,
    callType: 'audio',
    callId: null
  });
  
  // Active call state
  const [activeCall, setActiveCall] = useState<{
    isActive: boolean;
    targetUser: User | null;
    callType: 'audio' | 'video';
  }>({
    isActive: false,
    targetUser: null,
    callType: 'audio'
  });

  useEffect(() => {
    if (socket && user) {
      console.log('🔌 Setting up call listeners for user:', user.id);
      
      socket.on('incoming-call', (data) => {
        console.log('📞 Received incoming call:', data);
        setIncomingCall({
          isVisible: true,
          caller: data.initiator,
          callType: data.callType,
          callId: data.callId
        });
      });

      socket.on('call-rejected', () => {
        console.log('📞 Call was rejected');
        setIncomingCall({
          isVisible: false,
          caller: null,
          callType: 'audio',
          callId: null
        });
      });

      socket.on('call-error', (error) => {
        console.error('📞 Call error:', error);
        alert(`Call error: ${error.message}`);
      });

      return () => {
        socket.off('incoming-call');
        socket.off('call-rejected');
        socket.off('call-error');
      };
    }
  }, [socket, user]);

  if (!user) {
    return <AuthForm />;
  }

  const handleAcceptCall = () => {
    if (incomingCall.caller) {
      setActiveCall({
        isActive: true,
        targetUser: incomingCall.caller,
        callType: incomingCall.callType
      });
      setIncomingCall({
        isVisible: false,
        caller: null,
        callType: 'audio',
        callId: null
      });
    }
  };

  const handleRejectCall = () => {
    if (socket && incomingCall.callId) {
      socket.emit('reject-call', {
        roomId: [user.id, incomingCall.caller?._id].sort().join('-')
      });
    }
    setIncomingCall({
      isVisible: false,
      caller: null,
      callType: 'audio',
      callId: null
    });
  };

  const handleEndCall = () => {
    setActiveCall({
      isActive: false,
      targetUser: null,
      callType: 'audio'
    });
  };

  const handleStartCall = (targetUser: User, callType: 'audio' | 'video') => {
    setActiveCall({
      isActive: true,
      targetUser,
      callType
    });
  };

  return (
    <div className="h-screen flex bg-gray-900">
      {/* Connection Status */}
      <ConnectionStatus isConnected={isConnected} />
      
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-30 p-2 bg-gray-800 text-white rounded-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      <Sidebar
        selectedUser={selectedUser}
        onSelectUser={setSelectedUser}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <ChatRoom
        selectedUser={selectedUser}
        onBack={() => setSelectedUser(null)}
        onStartCall={handleStartCall}
      />

      {/* Incoming Call Notification */}
      {incomingCall.isVisible && incomingCall.caller && (
        <CallNotification
          isVisible={incomingCall.isVisible}
          caller={incomingCall.caller}
          callType={incomingCall.callType}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}

      {/* Active Call */}
      {activeCall.isActive && activeCall.targetUser && (
        <VideoCall
          targetUser={activeCall.targetUser}
          callType={activeCall.callType}
          onClose={handleEndCall}
        />
      )}

      {/* Test Button - Only in development */}
      {/* <TestCallButton /> */}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <ChatApp />
    </AuthProvider>
  );
}

export default App;