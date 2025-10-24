import { useRef, useState, useCallback } from 'react';

interface WebRTCConfig {
  onRemoteStream: (stream: MediaStream) => void;
  onCallEnd: () => void;
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
}

export const useWebRTC = ({ onRemoteStream, onCallEnd, onIceCandidate }: WebRTCConfig) => {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const createPeerConnection = useCallback(() => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && onIceCandidate) {
        onIceCandidate(event.candidate);
      }
    };

    peerConnection.ontrack = (event) => {
      console.log('Received remote stream');
      onRemoteStream(event.streams[0]);
    };

    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        onCallEnd();
      }
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  }, [onRemoteStream, onIceCandidate]);

  const startCall = useCallback(async (video = false) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video
      });

      localStreamRef.current = stream;
      const peerConnection = createPeerConnection();

      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      setIsCallActive(true);
      return stream;
    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  }, [createPeerConnection]);

  const createOffer = useCallback(async () => {
    if (!peerConnectionRef.current) return null;

    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    return offer;
  }, []);

  const createAnswer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return null;

    await peerConnectionRef.current.setRemoteDescription(offer);
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);
    return answer;
  }, []);

  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(answer);
    }
  }, []);

  const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    if (peerConnectionRef.current) {
      try {
        await peerConnectionRef.current.addIceCandidate(candidate);
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  }, []);

  const endCall = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setIsCallActive(false);
    setIsMuted(false);
    setIsVideoOff(false);
    onCallEnd();
  }, [onCallEnd]);

  return {
    startCall,
    createOffer,
    createAnswer,
    handleAnswer,
    addIceCandidate,
    endCall,
    toggleMute,
    toggleVideo,
    isCallActive,
    isMuted,
    isVideoOff,
    localStream: localStreamRef.current
  };
};