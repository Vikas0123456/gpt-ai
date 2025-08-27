import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { authAPI } from '../../services/api';
import { Search, MessageCircle, Settings, LogOut, Users } from 'lucide-react';

interface User {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  isOnline: boolean;
  lastSeen: string;
}

interface SidebarProps {
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedUser,
  onSelectUser,
  isOpen,
  onClose
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, logout } = useAuth();
  const { socket } = useSocket();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('userStatusUpdate', ({ userId, isOnline }) => {
        setUsers(prev => prev.map(u => 
          u._id === userId ? { ...u, isOnline } : u
        ));
      });

      return () => {
        socket.off('userStatusUpdate');
      };
    }
  }, [socket]);

  const loadUsers = async () => {
    try {
      const data = await authAPI.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserSelect = (selectedUser: User) => {
    onSelectUser(selectedUser);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative top-0 left-0 h-full w-80 bg-gray-800 border-r border-gray-700 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-8 h-8 text-blue-500" />
              <span className="text-xl font-bold text-white">ChatApp</span>
            </div>
            <button
              onClick={onClose}
              className="md:hidden text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <div className="flex items-center px-3 py-2 text-gray-400 text-sm font-semibold">
              <Users className="w-4 h-4 mr-2" />
              Online Users ({users.filter(u => u.isOnline).length})
            </div>
            
            {filteredUsers.map((chatUser) => (
              <button
                key={chatUser._id}
                onClick={() => handleUserSelect(chatUser)}
                className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                  selectedUser?._id === chatUser._id
                    ? 'bg-blue-600'
                    : 'hover:bg-gray-700'
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {chatUser.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {chatUser.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-gray-800 rounded-full" />
                  )}
                </div>
                
                <div className="ml-3 flex-1 text-left">
                  <p className="text-white font-semibold">{chatUser.username}</p>
                  <p className="text-gray-400 text-sm">
                    {chatUser.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </button>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400">No users found</p>
              </div>
            )}
          </div>
        </div>

        {/* User Profile & Logout */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user?.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-white font-semibold">{user?.username}</p>
                <p className="text-gray-400 text-sm">Online</p>
              </div>
            </div>
            
            <div className="flex space-x-1">
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg">
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};