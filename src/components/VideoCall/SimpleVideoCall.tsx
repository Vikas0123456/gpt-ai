import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, X } from 'lucide-react';

interface User {
  _id: string;
  username: string;
  isOnline: boolean;
}

interface SimpleVideoCallProps {
  targetUser: User;
  callType: 'audio' | 'video';
  onClose: () => void;
  isIncoming?: boolean;
}

export const SimpleVideoCall: React.FC<SimpleVideoCallProps> = ({
  targetUser,
  callType,
  onClose,
  isIncoming = false
}) => {
  const [callState, setCallState] = useState<'calling' | 'connected' | 'ended'>('calling');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  
  const { socket } = useSocket();
  const { user } = useAuth();

  // Initialize peer connection
  const createPeerConnection = () => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        console.log('📡 Sending ICE candidate');
        socket.emit('webrtc-ice-candidate', {
          roomId: [user?.id, targetUser._id].sort().join('-'),
          targetUserId: targetUser._id,
          candidate: event.candidate
        });
      }
    };

    peerConnection.ontrack = (event) => {
      console.log('📹 Received remote stream');
      setRemoteStream(event.streams[0]);
      setCallState('connected');
    };

    peerConnection.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        setCallState('ended');
        setTimeout(onClose, 1000);
      }
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  };

  // Get user media
  const getUserMedia = async () => {
    try {
      console.log('🎥 Requesting media access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video'
      });
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      console.log('✅ Media access granted');
      return stream;
    } catch (error) {
      console.error('❌ Media access denied:', error);
      alert('Camera/microphone access is required for calls');
      onClose();
      throw error;
    }
  };

  // Initialize call
  useEffect(() => {
    const initializeCall = async () => {
      try {
        console.log('🚀 Initializing call...', { callType, isIncoming });
        
        // Get media stream
        const stream = await getUserMedia();
        
        // Create peer connection
        const peerConnection = createPeerConnection();
        
        // Add local stream to peer connection
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });

        if (!isIncoming) {
          // Create offer for outgoing call
          console.log('📞 Creating offer...');
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          
          // Send call initiation
          const roomId = [user?.id, targetUser._id].sort().join('-');
          socket?.emit('initiate-video-call', { roomId, callType });
          
          // Send offer after delay
          setTimeout(() => {
            socket?.emit('webrtc-offer', {
              roomId,
              targetUserId: targetUser._id,
              offer
            });
          }, 1000);
        }
      } catch (error) {
        console.error('❌ Call initialization failed:', error);
        onClose();
      }
    };

    initializeCall();
  }, []);

  // Handle incoming call acceptance
  const handleAcceptCall = async () => {
    try {
      console.log('📞 Accepting call...');
      const stream = await getUserMedia();
      
      const peerConnection = createPeerConnection();
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      setCallState('connected');
      
      // Join the call
      const roomId = [user?.id, targetUser._id].sort().join('-');
      socket?.emit('join-video-call', { roomId });
    } catch (error) {
      console.error('❌ Error accepting call:', error);
    }
  };

  const handleRejectCall = () => {
    console.log('📞 Rejecting call...');
    const roomId = [user?.id, targetUser._id].sort().join('-');
    socket?.emit('reject-call', { roomId });
    onClose();
  };

  const handleEndCall = () => {
    console.log('📞 Ending call...');
    
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    // Notify server
    const roomId = [user?.id, targetUser._id].sort().join('-');
    socket?.emit('end-video-call', { roomId });
    
    onClose();
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleWebRTCOffer = async (data: any) => {
      console.log('📞 Received WebRTC offer:', data);
      try {
        if (!peerConnectionRef.current) {
          const stream = await getUserMedia();
          const peerConnection = createPeerConnection();
          stream.getTracks().forEach(track => {
            peerConnection.addTrack(track, stream);
          });
        }

        await peerConnectionRef.current!.setRemoteDescription(data.offer);
        const answer = await peerConnectionRef.current!.createAnswer();
        await peerConnectionRef.current!.setLocalDescription(answer);

        socket.emit('webrtc-answer', {
          roomId: [user?.id, targetUser._id].sort().join('-'),
          targetUserId: data.fromUserId,
          answer
        });
      } catch (error) {
        console.error('❌ Error handling offer:', error);
      }
    };

    const handleWebRTCAnswer = async (data: any) => {
      console.log('📞 Received WebRTC answer:', data);
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(data.answer);
        }
      } catch (error) {
        console.error('❌ Error handling answer:', error);
      }
    };

    const handleIceCandidate = async (data: any) => {
      console.log('🧊 Received ICE candidate:', data);
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(data.candidate);
        }
      } catch (error) {
        console.error('❌ Error adding ICE candidate:', error);
      }
    };

    socket.on('webrtc-offer', handleWebRTCOffer);
    socket.on('webrtc-answer', handleWebRTCAnswer);
    socket.on('webrtc-ice-candidate', handleIceCandidate);

    return () => {
      socket.off('webrtc-offer', handleWebRTCOffer);
      socket.off('webrtc-answer', handleWebRTCAnswer);
      socket.off('webrtc-ice-candidate', handleIceCandidate);
    };
  }, [socket, user?.id, targetUser._id]);

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
            {remoteStream && (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Local Video (Picture in Picture) */}
            {localStream && (
              <div className="absolute top-4 right-4 w-32 h-24 bg-gray-700 rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            )}
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
        {isIncoming && callState === 'calling' && (
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
        {!isIncoming && callState === 'connected' && (
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
