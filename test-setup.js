#!/usr/bin/env node

/**
 * Simple test script to validate the application setup
 * Run with: node test-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Real-Time Communication Application Setup...\n');

// Check if required files exist
const requiredFiles = [
  'package.json',
  'server/package.json',
  'server/index.js',
  'src/App.tsx',
  'src/hooks/useSocket.ts',
  'src/hooks/useWebRTC.ts',
  'src/components/VideoCall/VideoCall.tsx',
  'src/components/VideoCall/CallNotification.tsx',
  'server/sockets/socketHandlers.js',
  'server/models/Message.js',
  'server/models/VideoCall.js'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Check package.json dependencies
console.log('\n📦 Checking dependencies...');

try {
  const clientPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const serverPackage = JSON.parse(fs.readFileSync('server/package.json', 'utf8'));
  
  const requiredClientDeps = ['react', 'socket.io-client', 'axios', 'uuid'];
  const requiredServerDeps = ['express', 'socket.io', 'mongoose', 'jsonwebtoken'];
  
  console.log('Client dependencies:');
  requiredClientDeps.forEach(dep => {
    if (clientPackage.dependencies && clientPackage.dependencies[dep]) {
      console.log(`✅ ${dep}@${clientPackage.dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep} - MISSING`);
      allFilesExist = false;
    }
  });
  
  console.log('\nServer dependencies:');
  requiredServerDeps.forEach(dep => {
    if (serverPackage.dependencies && serverPackage.dependencies[dep]) {
      console.log(`✅ ${dep}@${serverPackage.dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep} - MISSING`);
      allFilesExist = false;
    }
  });
  
} catch (error) {
  console.log('❌ Error reading package.json files');
  allFilesExist = false;
}

// Check for .env file
console.log('\n🔧 Checking environment setup...');
if (fs.existsSync('server/.env')) {
  console.log('✅ server/.env file exists');
} else {
  console.log('⚠️  server/.env file not found - you may need to create it');
}

// Summary
console.log('\n📊 Setup Summary:');
if (allFilesExist) {
  console.log('✅ All required files and dependencies are present!');
  console.log('\n🚀 Next steps:');
  console.log('1. Create server/.env file with your configuration');
  console.log('2. Run: npm install');
  console.log('3. Run: cd server && npm install');
  console.log('4. Run: cd server && npm run init-db');
  console.log('5. Run: npm run dev');
  console.log('\n🎉 Your real-time communication app is ready!');
} else {
  console.log('❌ Some files or dependencies are missing');
  console.log('Please check the missing items above and re-run this test');
}

console.log('\n📚 For detailed setup instructions, see README.md');
