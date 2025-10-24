import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';
import { VideoCall } from '../VideoCall/VideoCall';
import { messageAPI } from '../../services/api';
import { Phone, Video, MoreVertical } from 'lucide-react';

interface Message {
  _id: string;
  sender: {
    _id: string;
    username: string;
    avatar: string;
  };
  content: string;
  messageType: 'text' | 'image' | 'video' | 'file';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  createdAt: string;
}

interface User {
  _id: string;
  username: string;
  avatar: string;
  isOnline: boolean;
}

interface ChatRoomProps {
  selectedUser: User | null;
  onBack: () => void;
  onStartCall?: (targetUser: User, callType: 'audio' | 'video') => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ selectedUser, onBack, onStartCall }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const { socket } = useSocket();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const roomId = selectedUser && user ? 
    [user.id, selectedUser._id].sort().join('-') : '';

  useEffect(() => {
    if (selectedUser && roomId) {
      loadMessages();
      
      if (socket) {
        socket.emit('join-rooms', [roomId]);
      }
    }
  }, [selectedUser, roomId]);

  useEffect(() => {
    if (socket) {
      console.log('Setting up socket listeners for room:', roomId);
      
      socket.on('new-message', (message: Message) => {
        console.log('Received new message:', message);
        setMessages(prev => [...prev, message]);
      });

      socket.on('user-typing', ({ userId, username }) => {
        console.log('User typing:', username);
        setTypingUsers(prev => {
          if (!prev.includes(username)) {
            return [...prev, username];
          }
          return prev;
        });
      });

      socket.on('user-stop-typing', ({ userId }) => {
        console.log('User stopped typing:', userId);
        setTypingUsers(prev => {
          // Remove user from typing list
          return prev.filter((_, index) => index !== 0); // Simple approach for now
        });
      });

      return () => {
        socket.off('new-message');
        socket.off('user-typing');
        socket.off('user-stop-typing');
      };
    }
  }, [socket, roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const data = await messageAPI.getMessages(roomId);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (messageData: any) => {
    if (socket) {
      socket.emit('send-message', {
        ...messageData,
        room: roomId
      });
    }
  };

  const handleStartCall = (type: 'audio' | 'video') => {
    if (onStartCall && selectedUser) {
      onStartCall(selectedUser, type);
    } else {
      setCallType(type);
      setIsCallModalOpen(true);
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center text-gray-400">
          <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
          <p>Choose a user from the sidebar to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900 h-full">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="md:hidden text-gray-400 hover:text-white"
            >
              ←
            </button>
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {selectedUser.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-white font-semibold">{selectedUser.username}</h3>
              <p className="text-sm text-gray-400">
                {selectedUser.isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleStartCall('audio')}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleStartCall('video')}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Video className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <MessageList 
          messages={messages} 
          currentUserId={user?.id || ''} 
          typingUsers={typingUsers}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput onSendMessage={handleSendMessage} roomId={roomId} />

      {/* Video Call Modal */}
      {isCallModalOpen && (
        <VideoCall
          targetUser={selectedUser}
          callType={callType}
          onClose={() => setIsCallModalOpen(false)}
        />
      )}
    </div>
  );
};