#!/usr/bin/env node

/**
 * Debug script to test the real-time communication application
 * Run with: node debug-connection.js
 */

const io = require('socket.io-client');

console.log('🔍 Testing Real-Time Communication Application...\n');

// Test server connection
const socket = io('http://localhost:5000', {
  auth: { token: 'test-token' }
});

socket.on('connect', () => {
  console.log('✅ Connected to server');
  console.log('Socket ID:', socket.id);
  
  // Test room joining
  socket.emit('join-rooms', ['test-room-123']);
  console.log('📡 Emitted join-rooms event');
  
  // Test message sending
  setTimeout(() => {
    socket.emit('send-message', {
      content: 'Test message',
      room: 'test-room-123',
      messageType: 'text'
    });
    console.log('📨 Emitted test message');
  }, 1000);
  
  // Test call initiation
  setTimeout(() => {
    socket.emit('initiate-video-call', {
      roomId: 'test-room-123',
      callType: 'video'
    });
    console.log('📞 Emitted video call initiation');
  }, 2000);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message);
});

socket.on('new-message', (message) => {
  console.log('📨 Received message:', message);
});

socket.on('incoming-call', (data) => {
  console.log('📞 Received incoming call:', data);
});

socket.on('webrtc-offer', (data) => {
  console.log('🎥 Received WebRTC offer:', data);
});

socket.on('webrtc-answer', (data) => {
  console.log('🎥 Received WebRTC answer:', data);
});

socket.on('webrtc-ice-candidate', (data) => {
  console.log('🧊 Received ICE candidate:', data);
});

socket.on('error', (error) => {
  console.log('❌ Socket error:', error);
});

// Clean up after 10 seconds
setTimeout(() => {
  console.log('\n🏁 Test completed');
  socket.disconnect();
  process.exit(0);
}, 10000);
