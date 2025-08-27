import React from 'react';
import { format } from 'date-fns';
import { Download, Image as ImageIcon, Video as VideoIcon, FileText } from 'lucide-react';

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

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  typingUsers: string[];
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  typingUsers
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderMessageContent = (message: Message) => {
    const baseUrl = 'http://localhost:5000';
    
    switch (message.messageType) {
      case 'image':
        return (
          <div className="max-w-sm">
            <img
              src={`${baseUrl}${message.fileUrl}`}
              alt="Shared image"
              className="rounded-lg max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(`${baseUrl}${message.fileUrl}`, '_blank')}
            />
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        );
        
      case 'video':
        return (
          <div className="max-w-sm">
            <video
              src={`${baseUrl}${message.fileUrl}`}
              controls
              className="rounded-lg max-h-64 w-full"
            />
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        );
        
      case 'file':
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg max-w-sm">
            <div className="flex-shrink-0">
              <FileText className="w-8 h-8 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{message.fileName}</p>
              <p className="text-xs text-gray-400">
                {message.fileSize && formatFileSize(message.fileSize)}
              </p>
            </div>
            <a
              href={`${baseUrl}${message.fileUrl}`}
              download={message.fileName}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-white"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
        );
        
      default:
        return <p>{message.content}</p>;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const isOwnMessage = message.sender._id === currentUserId;
        
        return (
          <div
            key={message._id}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-2xl ${
                isOwnMessage
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-100'
              }`}
            >
              {!isOwnMessage && (
                <p className="text-xs text-gray-300 mb-1 font-semibold">
                  {message.sender.username}
                </p>
              )}
              
              {renderMessageContent(message)}
              
              <p className={`text-xs mt-1 ${
                isOwnMessage ? 'text-blue-100' : 'text-gray-400'
              }`}>
                {format(new Date(message.createdAt), 'HH:mm')}
              </p>
            </div>
          </div>
        );
      })}
      
      {typingUsers.length > 0 && (
        <div className="flex justify-start">
          <div className="bg-gray-700 text-gray-100 px-4 py-2 rounded-2xl">
            <p className="text-sm">
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};