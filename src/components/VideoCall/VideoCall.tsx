import React, { useState, useRef, useEffect } from 'react';
import { useWebRTC } from '../../hooks/useWebRTC';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, X } from 'lucide-react';

interface User {
  _id: string;
  username: string;
  isOnline: boolean;
}

interface VideoCallProps {
  targetUser: User;
  callType: 'audio' | 'video';
  onClose: () => void;
}

export const VideoCall: React.FC<VideoCallProps> = ({
  targetUser,
  callType,
  onClose
}) => {
  const [callState, setCallState] = useState<'calling' | 'connected' | 'ended'>('calling');
  const [incomingCall, setIncomingCall] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { socket } = useSocket();
  const { user } = useAuth();

  const {
    startCall,
    createOffer,
    createAnswer,
    handleAnswer,
    addIceCandidate,
    endCall,
    toggleMute,
    toggleVideo,
    isMuted,
    isVideoOff
  } = useWebRTC({
    onRemoteStream: (stream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
      setCallState('connected');
    },
    onCallEnd: () => {
      setCallState('ended');
      setTimeout(onClose, 1000);
    },
    onIceCandidate: (candidate) => {
      if (socket && targetUser) {
        socket.emit('webrtc-ice-candidate', {
          roomId: [user?.id, targetUser._id].sort().join('-'),
          targetUserId: targetUser._id,
          candidate
        });
      }
    }
  });

  useEffect(() => {
    if (socket) {
      socket.on('incoming-call', (data) => {
        console.log('Incoming call:', data);
        setIncomingCall(true);
      });

      socket.on('webrtc-offer', async (data) => {
        console.log('Received WebRTC offer:', data);
        try {
          // Create peer connection for incoming call
          const stream = await startCall(callType === 'video');
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          
          const answer = await createAnswer(data.offer);
          if (answer && socket) {
            socket.emit('webrtc-answer', {
              roomId: [user?.id, targetUser._id].sort().join('-'),
              targetUserId: data.fromUserId,
              answer
            });
          }
        } catch (error) {
          console.error('Error handling offer:', error);
        }
      });

      socket.on('webrtc-answer', async (data) => {
        console.log('Received WebRTC answer:', data);
        await handleAnswer(data.answer);
      });

      socket.on('webrtc-ice-candidate', async (data) => {
        console.log('Received ICE candidate:', data);
        await addIceCandidate(data.candidate);
      });

      socket.on('call-rejected', () => {
        setCallState('ended');
        setTimeout(onClose, 1000);
      });

      socket.on('call-ended', () => {
        endCall();
      });

      return () => {
        socket.off('incoming-call');
        socket.off('webrtc-offer');
        socket.off('webrtc-answer');
        socket.off('webrtc-ice-candidate');
        socket.off('call-rejected');
        socket.off('call-ended');
      };
    }
  }, [socket, createAnswer, handleAnswer, addIceCandidate, endCall, user?.id, targetUser._id, callType, startCall]);

  useEffect(() => {
    const initializeCall = async () => {
      try {
        console.log('🚀 Initializing call...', { callType, targetUser: targetUser._id });
        
        // Check if we have required permissions
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Media devices not supported');
        }
        
        const stream = await startCall(callType === 'video');
        console.log('✅ Media stream obtained:', stream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          console.log('✅ Local video element updated');
        }

        const offer = await createOffer();
        console.log('✅ WebRTC offer created:', offer);
        
        if (offer && socket) {
          const roomId = [user?.id, targetUser._id].sort().join('-');
          console.log('📞 Initiating call for room:', roomId);
          
          socket.emit('initiate-video-call', {
            roomId,
            callType
          });
          
          // Send the offer after a short delay to ensure the call is set up
          setTimeout(() => {
            console.log('📡 Sending WebRTC offer...');
            socket.emit('webrtc-offer', {
              roomId,
              targetUserId: targetUser._id,
              offer
            });
          }, 2000);
        } else {
          console.error('❌ Missing offer or socket');
        }
      } catch (error) {
        console.error('❌ Error starting call:', error);
        alert(`Call failed: ${error.message}`);
        onClose();
      }
    };

    if (!incomingCall) {
      initializeCall();
    }
  }, []);

  const handleEndCall = () => {
    if (socket) {
      socket.emit('end-video-call', { 
        roomId: [user?.id, targetUser._id].sort().join('-') 
      });
    }
    endCall();
    onClose();
  };

  const handleAcceptCall = async () => {
    try {
      console.log('Accepting call...');
      const stream = await startCall(callType === 'video');
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIncomingCall(false);
      setCallState('connected');
      
      // Join the call
      if (socket) {
        const roomId = [user?.id, targetUser._id].sort().join('-');
        socket.emit('join-video-call', {
          roomId
        });
        console.log('Joined call for room:', roomId);
      }
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  };

  const handleRejectCall = () => {
    if (socket) {
      socket.emit('reject-call', { 
        roomId: [user?.id, targetUser._id].sort().join('-') 
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {targetUser.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">{targetUser.username}</h3>
              <p className="text-gray-400 text-sm">
                {callState === 'calling' ? 'Calling...' : 
                 callState === 'connected' ? 'Connected' : 'Call ended'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Area */}
        {callType === 'video' && (
          <div className="relative bg-gray-800 rounded-xl overflow-hidden mb-6" style={{ height: '400px' }}>
            {/* Remote Video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Local Video (Picture in Picture) */}
            <div className="absolute top-4 right-4 w-32 h-24 bg-gray-700 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Audio Only View */}
        {callType === 'audio' && (
          <div className="flex items-center justify-center py-16 mb-6">
            <div className="text-center">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-semibold text-2xl">
                  {targetUser.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">{targetUser.username}</h3>
              <p className="text-gray-400">Audio call in progress...</p>
            </div>
          </div>
        )}

        {/* Incoming Call Controls */}
        {incomingCall && (
          <div className="flex justify-center space-x-6 mb-6">
            <button
              onClick={handleRejectCall}
              className="w-14 h-14 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <button
              onClick={handleAcceptCall}
              className="w-14 h-14 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <Phone className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Call Controls */}
        {!incomingCall && (
          <div className="flex justify-center space-x-4">
            <button
              onClick={toggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors ${
                isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {callType === 'video' && (
              <button
                onClick={toggleVideo}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors ${
                  isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>
            )}

            <button
              onClick={handleEndCall}
              className="w-12 h-12 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};