import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video, Mic } from 'lucide-react';

interface User {
  _id: string;
  username: string;
  avatar: string;
}

interface CallNotificationProps {
  isVisible: boolean;
  caller: User;
  callType: 'audio' | 'video';
  onAccept: () => void;
  onReject: () => void;
}

export const CallNotification: React.FC<CallNotificationProps> = ({
  isVisible,
  caller,
  callType,
  onAccept,
  onReject
}) => {
  const [isRinging, setIsRinging] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const ringIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isVisible) {
      setIsRinging(true);
      startRinging();
    } else {
      stopRinging();
    }

    return () => {
      stopRinging();
    };
  }, [isVisible]);

  const startRinging = () => {
    // Create a simple ring tone using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);

    // Repeat ringing every 2 seconds
    ringIntervalRef.current = setInterval(() => {
      const newOscillator = audioContext.createOscillator();
      const newGainNode = audioContext.createGain();
      
      newOscillator.connect(newGainNode);
      newGainNode.connect(audioContext.destination);
      
      newOscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      newOscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      newOscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      newGainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      newGainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      newOscillator.start(audioContext.currentTime);
      newOscillator.stop(audioContext.currentTime + 0.3);
    }, 2000);
  };

  const stopRinging = () => {
    setIsRinging(false);
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
        {/* Caller Avatar */}
        <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-semibold text-3xl">
            {caller.username.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Caller Info */}
        <h3 className="text-white text-2xl font-semibold mb-2">{caller.username}</h3>
        <p className="text-gray-400 mb-6">
          {callType === 'video' ? 'Incoming video call' : 'Incoming audio call'}
        </p>

        {/* Ringing Animation */}
        {isRinging && (
          <div className="flex justify-center mb-8">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        )}

        {/* Call Controls */}
        <div className="flex justify-center space-x-6">
          <button
            onClick={onReject}
            className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
          <button
            onClick={onAccept}
            className="w-16 h-16 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <Phone className="w-6 h-6" />
          </button>
        </div>

        {/* Call Type Indicator */}
        <div className="flex items-center justify-center mt-4 space-x-2 text-gray-400">
          {callType === 'video' ? (
            <Video className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
          <span className="text-sm">
            {callType === 'video' ? 'Video Call' : 'Audio Call'}
          </span>
        </div>
      </div>
    </div>
  );
};
