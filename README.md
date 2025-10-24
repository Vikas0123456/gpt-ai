# Real-Time Communication Application

A full-stack real-time communication application with video calling, audio calling, and chat functionality built with React, Node.js, Socket.IO, and WebRTC.

## Features

### ✅ Video & Audio Calling
- **One-on-one video calls** with WebRTC
- **Audio-only calls** for voice communication
- **Call notifications** with ringing sounds
- **Call acceptance/rejection** flow
- **Real-time connection status** indicators

### ✅ Real-Time Chat
- **Instant messaging** with Socket.IO
- **File sharing** (images, videos, documents)
- **Typing indicators**
- **Message reactions**
- **Online/offline status**

### ✅ Connection Management
- **Auto-reconnection** on network issues
- **Connection status** indicators
- **Stable WebRTC connections**
- **Error handling** and recovery

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Socket.IO Client** for real-time communication
- **WebRTC** for peer-to-peer connections
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **Socket.IO** for real-time events
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Multer** for file uploads
- **CORS** for cross-origin requests

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd project
```

### 2. Install Dependencies

#### Frontend Dependencies
```bash
npm install
```

#### Backend Dependencies
```bash
cd server
npm install
cd ..
```

### 3. Environment Setup

Create a `.env` file in the `server` directory:
```env
MONGODB_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:5173
PORT=5000
NODE_ENV=development
```

### 4. Database Setup
```bash
cd server
npm run init-db
```

### 5. Start the Application

#### Development Mode (Both Frontend & Backend)
```bash
npm run dev
```

#### Or Start Separately

**Backend Server:**
```bash
cd server
npm start
```

**Frontend Client:**
```bash
npm run client
```

## Usage

### 1. User Registration/Login
- Open the application in your browser (http://localhost:5173)
- Register a new account or login with existing credentials
- The app will automatically connect to the server

### 2. Chat Functionality
- Select a user from the sidebar to start chatting
- Send text messages, images, videos, or files
- See typing indicators when others are typing
- View online/offline status of users

### 3. Video/Audio Calls
- Click the phone or video icon next to a user's name
- The other user will receive a call notification with ringing
- Accept or reject the call
- Use call controls (mute, video toggle, end call)

### 4. Connection Management
- The app automatically handles reconnections
- Connection status is shown in the top-right corner
- Calls are maintained during brief network interruptions

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/auth/users` - Get all users

### Messages
- `GET /api/messages/:room` - Get messages for a room
- `POST /api/messages` - Send a message

### File Upload
- `POST /api/upload` - Upload files

### Rooms
- `GET /api/rooms` - Get user rooms
- `POST /api/rooms` - Create a room

## Socket.IO Events

### Client to Server
- `join-rooms` - Join chat rooms
- `send-message` - Send a message
- `typing-start` - Start typing indicator
- `typing-stop` - Stop typing indicator
- `initiate-video-call` - Start a video call
- `join-video-call` - Join an active call
- `webrtc-offer` - WebRTC offer
- `webrtc-answer` - WebRTC answer
- `webrtc-ice-candidate` - ICE candidate
- `reject-call` - Reject incoming call
- `end-video-call` - End active call

### Server to Client
- `new-message` - New message received
- `user-typing` - User typing indicator
- `user-stop-typing` - User stopped typing
- `incoming-call` - Incoming call notification
- `webrtc-offer` - WebRTC offer received
- `webrtc-answer` - WebRTC answer received
- `webrtc-ice-candidate` - ICE candidate received
- `call-rejected` - Call was rejected
- `call-ended` - Call ended
- `user-status-changed` - User online/offline status

## Testing the Application

### 1. Basic Functionality Test
1. Open two browser windows/tabs
2. Register/login with different accounts
3. Start a chat between the users
4. Send messages and files
5. Initiate video/audio calls
6. Test call acceptance/rejection

### 2. Network Resilience Test
1. Start a call between two users
2. Disconnect one user's network briefly
3. Verify reconnection and call stability
4. Test with poor network conditions

### 3. Multi-User Test
1. Open multiple browser windows
2. Test group chat functionality
3. Test multiple simultaneous calls
4. Verify proper user status updates

## Troubleshooting

### Common Issues

1. **WebRTC Connection Failed**
   - Check browser permissions for camera/microphone
   - Ensure HTTPS in production
   - Verify STUN server accessibility

2. **Socket Connection Issues**
   - Check server is running on port 5000
   - Verify CORS settings
   - Check network connectivity

3. **Database Connection**
   - Ensure MongoDB is running
   - Check connection string in .env
   - Verify database permissions

4. **File Upload Issues**
   - Check file size limits
   - Verify upload directory permissions
   - Check supported file types

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in the server .env file.

## Production Deployment

### Frontend (Vite)
```bash
npm run build
# Deploy the dist/ folder to your hosting service
```

### Backend (Node.js)
```bash
cd server
npm start
# Use PM2 or similar for process management
```

### Environment Variables
Update the following for production:
- `MONGODB_URI` - Production database URL
- `JWT_SECRET` - Strong secret key
- `CLIENT_URL` - Production frontend URL
- `NODE_ENV=production`

## Security Considerations

- JWT tokens for authentication
- CORS configuration
- File upload validation
- Input sanitization
- Rate limiting (recommended)

## Performance Optimization

- WebRTC connection optimization
- Socket.IO room management
- Database indexing
- File compression
- CDN for static assets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the console logs
3. Check network connectivity
4. Verify all dependencies are installed
