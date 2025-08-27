import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthForm } from './components/Auth/AuthForm';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ChatRoom } from './components/Chat/ChatRoom';
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="h-screen flex bg-gray-900">
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
      />
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