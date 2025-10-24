#!/usr/bin/env node

/**
 * Test script to verify video/audio calling functionality
 * Run with: node test-calls.js
 */

import { io } from 'socket.io-client';

console.log('🔍 Testing Video/Audio Call Functionality...\n');

// Test server connection
const socket1 = io('http://localhost:5000', {
  auth: { token: 'test-token-1' }
});

const socket2 = io('http://localhost:5000', {
  auth: { token: 'test-token-2' }
});

let callInitiated = false;

socket1.on('connect', () => {
  console.log('✅ User 1 connected');
  
  socket1.emit('join-rooms', ['test-room-123']);
  console.log('📡 User 1 joined room');
  
  // Test call initiation after a delay
  setTimeout(() => {
    if (!callInitiated) {
      console.log('📞 User 1 initiating video call...');
      socket1.emit('initiate-video-call', {
        roomId: 'test-room-123',
        callType: 'video'
      });
      callInitiated = true;
    }
  }, 2000);
});

socket2.on('connect', () => {
  console.log('✅ User 2 connected');
  
  socket2.emit('join-rooms', ['test-room-123']);
  console.log('📡 User 2 joined room');
});

socket1.on('call-initiated', (data) => {
  console.log('📞 User 1: Call initiated:', data);
});

socket2.on('incoming-call', (data) => {
  console.log('📞 User 2: Received incoming call:', data);
  
  // Simulate accepting the call
  setTimeout(() => {
    console.log('📞 User 2: Accepting call...');
    socket2.emit('join-video-call', {
      roomId: 'test-room-123'
    });
  }, 1000);
});

socket1.on('call-joined', (data) => {
  console.log('📞 User 1: Call joined:', data);
  
  // Test WebRTC signaling
  setTimeout(() => {
    console.log('🎥 Testing WebRTC offer...');
    socket1.emit('webrtc-offer', {
      roomId: 'test-room-123',
      targetUserId: 'user2',
      offer: { type: 'offer', sdp: 'test-offer' }
    });
  }, 1000);
});

socket2.on('webrtc-offer', (data) => {
  console.log('🎥 User 2: Received WebRTC offer:', data);
  
  // Simulate sending answer
  setTimeout(() => {
    console.log('🎥 User 2: Sending WebRTC answer...');
    socket2.emit('webrtc-answer', {
      roomId: 'test-room-123',
      targetUserId: 'user1',
      answer: { type: 'answer', sdp: 'test-answer' }
    });
  }, 500);
});

socket1.on('webrtc-answer', (data) => {
  console.log('🎥 User 1: Received WebRTC answer:', data);
  console.log('✅ WebRTC signaling test completed successfully!');
});

socket1.on('call-error', (error) => {
  console.log('❌ User 1: Call error:', error);
});

socket2.on('call-error', (error) => {
  console.log('❌ User 2: Call error:', error);
});

socket1.on('disconnect', () => {
  console.log('❌ User 1 disconnected');
});

socket2.on('disconnect', () => {
  console.log('❌ User 2 disconnected');
});

// Clean up after 15 seconds
setTimeout(() => {
  console.log('\n🏁 Call test completed');
  socket1.disconnect();
  socket2.disconnect();
  process.exit(0);
}, 15000);
