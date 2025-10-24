# 🔧 Video/Audio Call Debugging Guide

## Quick Fix Checklist

### 1. **Browser Permissions**
- ✅ Allow camera/microphone access when prompted
- ✅ Check browser console for permission errors
- ✅ Test in Chrome/Firefox (Safari may have issues)

### 2. **Network Requirements**
- ✅ HTTPS required for WebRTC (Vercel provides this)
- ✅ Check if firewall blocks WebRTC
- ✅ Test on different networks

### 3. **Application State**
- ✅ Both users must be logged in
- ✅ Socket connection must be active (green indicator)
- ✅ Users must be in the same "room"

## Step-by-Step Debugging

### Step 1: Test Basic Functionality
1. Open the application in two browser windows
2. Register/login with different accounts
3. Click the "Test Call" button (bottom-left in development)
4. Check browser console for test results

### Step 2: Test Call Flow
1. **User A**: Click phone/video icon next to User B
2. **Expected**: User B receives call notification
3. **User B**: Accept the call
4. **Expected**: WebRTC connection establishes

### Step 3: Check Console Logs
Look for these log messages:

#### ✅ **Success Logs:**
```
🚀 Initializing call...
🎥 Requesting media access...
✅ Media access granted
📞 Creating offer...
📡 Sending WebRTC offer...
📞 Received WebRTC offer...
📹 Received remote stream
🔗 Connection state: connected
```

#### ❌ **Error Logs:**
```
❌ Media access denied
❌ WebRTC not supported
❌ Call initialization failed
❌ Missing offer or socket
```

## Common Issues & Solutions

### Issue 1: "Media access denied"
**Solution:**
- Click the camera/microphone icon in browser address bar
- Allow permissions
- Refresh the page

### Issue 2: "WebRTC not supported"
**Solution:**
- Use Chrome or Firefox
- Update browser
- Check if on HTTPS

### Issue 3: "Call not connecting"
**Solution:**
- Check socket connection (green indicator)
- Verify both users are online
- Check console for WebRTC errors

### Issue 4: "No incoming call notification"
**Solution:**
- Check socket connection
- Verify room joining
- Check server logs

## Manual Testing Steps

### Test 1: Media Access
```javascript
// Run in browser console
navigator.mediaDevices.getUserMedia({ audio: true, video: true })
  .then(stream => {
    console.log('✅ Media access works');
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(error => {
    console.error('❌ Media access failed:', error);
  });
```

### Test 2: WebRTC Support
```javascript
// Run in browser console
if (window.RTCPeerConnection) {
  console.log('✅ WebRTC supported');
} else {
  console.log('❌ WebRTC not supported');
}
```

### Test 3: Socket Connection
```javascript
// Check if socket is connected
console.log('Socket connected:', window.socket?.connected);
```

## Server-Side Debugging

### Check Server Logs
Look for these messages in server terminal:
```
User joining rooms: [room-id]
Received message: {...}
Sending incoming call to user: user-id
Received WebRTC offer: {...}
```

### Test Socket Events
```bash
# Install socket.io-client globally
npm install -g socket.io-client

# Test connection
node -e "
const io = require('socket.io-client');
const socket = io('http://localhost:5000');
socket.on('connect', () => console.log('Connected'));
socket.on('disconnect', () => console.log('Disconnected'));
"
```

## Production Debugging

### Vercel Function Logs
1. Go to Vercel dashboard
2. Select your backend project
3. Go to Functions tab
4. Check logs for errors

### Network Issues
- Check if both frontend and backend are deployed
- Verify environment variables
- Test API endpoints directly

## Emergency Fixes

### If Nothing Works:
1. **Clear browser cache**
2. **Restart server**
3. **Check all environment variables**
4. **Test with different browsers**
5. **Check network connectivity**

### Quick Reset:
```bash
# Stop all processes
taskkill /f /im node.exe

# Restart server
cd server && npm start

# Restart client
npm run client
```

## Success Indicators

### ✅ **Call is Working When:**
- Both users see video/audio
- Mute/unmute works
- Video toggle works
- Call can be ended properly
- No console errors

### ❌ **Call is NOT Working When:**
- No media access
- No incoming call notification
- WebRTC connection fails
- Console shows errors
- Users can't see/hear each other

## Getting Help

If still not working:
1. Check browser console for errors
2. Check server terminal for errors
3. Test with different users
4. Try different browsers
5. Check network connectivity

The simplified VideoCall component should resolve most issues!
