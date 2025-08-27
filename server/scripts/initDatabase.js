import mongoose from 'mongoose';
import User from '../models/User.js';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import dotenv from 'dotenv';

dotenv.config();

const initDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp');
    console.log('Connected to MongoDB');

    // Create collections if they don't exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);

    if (!collectionNames.includes('users')) {
      await mongoose.connection.db.createCollection('users');
      console.log('Created users collection');
    }

    if (!collectionNames.includes('rooms')) {
      await mongoose.connection.db.createCollection('rooms');
      console.log('Created rooms collection');
    }

    if (!collectionNames.includes('messages')) {
      await mongoose.connection.db.createCollection('messages');
      console.log('Created messages collection');
    }

    if (!collectionNames.includes('videocalls')) {
      await mongoose.connection.db.createCollection('videocalls');
      console.log('Created videocalls collection');
    }

    // Create default rooms
    const defaultRooms = [
      {
        name: 'General',
        description: 'General discussion room',
        type: 'public'
      },
      {
        name: 'Random',
        description: 'Random conversations',
        type: 'public'
      },
      {
        name: 'Tech Talk',
        description: 'Technology discussions',
        type: 'public'
      }
    ];

    // Create admin user if doesn't exist
    let adminUser = await User.findOne({ email: 'admin@chatapp.com' });
    if (!adminUser) {
      adminUser = new User({
        username: 'admin',
        email: 'admin@chatapp.com',
        password: 'admin123456'
      });
      await adminUser.save();
      console.log('Created admin user');
    }

    // Create default rooms if they don't exist
    for (const roomData of defaultRooms) {
      const existingRoom = await Room.findOne({ name: roomData.name });
      if (!existingRoom) {
        const room = new Room({
          ...roomData,
          creator: adminUser._id,
          members: [{
            user: adminUser._id,
            role: 'admin'
          }]
        });
        await room.save();
        console.log(`Created room: ${roomData.name}`);
      }
    }

    console.log('Database initialization completed successfully!');
    console.log('\nDefault Admin Credentials:');
    console.log('Email: admin@chatapp.com');
    console.log('Password: admin123456');
    
  } catch (error) {
    console.error('Database initialization failed:', error);
  } finally {
    await mongoose.connection.close();
  }
};

// Run initialization
initDatabase();
