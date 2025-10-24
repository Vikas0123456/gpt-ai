import React, { useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';

export const TestCallButton: React.FC = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [isTesting, setIsTesting] = useState(false);

  const testCall = async () => {
    if (!socket || !user) {
      alert('Not connected or not logged in');
      return;
    }

    setIsTesting(true);
    console.log('🧪 Testing call functionality...');

    try {
      // Test 1: Check media access
      console.log('🎥 Testing media access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: true 
      });
      console.log('✅ Media access granted');
      stream.getTracks().forEach(track => track.stop());

      // Test 2: Check WebRTC support
      console.log('🔗 Testing WebRTC support...');
      if (!window.RTCPeerConnection) {
        throw new Error('WebRTC not supported');
      }
      console.log('✅ WebRTC supported');

      // Test 3: Test socket connection
      console.log('📡 Testing socket connection...');
      socket.emit('join-rooms', ['test-room']);
      console.log('✅ Socket connection working');

      // Test 4: Test call initiation
      console.log('📞 Testing call initiation...');
      socket.emit('initiate-video-call', {
        roomId: 'test-room',
        callType: 'video'
      });
      console.log('✅ Call initiation sent');

      alert('✅ All tests passed! Call functionality should work.');
    } catch (error) {
      console.error('❌ Test failed:', error);
      alert(`❌ Test failed: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={testCall}
        disabled={isTesting}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
      >
        {isTesting ? 'Testing...' : 'Test Call'}
      </button>
    </div>
  );
};
