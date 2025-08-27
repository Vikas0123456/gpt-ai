import mongoose from 'mongoose';

const videoCallSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  initiator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: Date,
    status: {
      type: String,
      enum: ['joined', 'left', 'kicked'],
      default: 'joined'
    }
  }],
  status: {
    type: String,
    enum: ['active', 'ended'],
    default: 'active'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date,
  duration: Number, // in seconds
  callType: {
    type: String,
    enum: ['video', 'audio'],
    default: 'video'
  }
}, {
  timestamps: true
});

videoCallSchema.index({ roomId: 1 });
videoCallSchema.index({ initiator: 1 });
videoCallSchema.index({ status: 1 });

export default mongoose.model('VideoCall', videoCallSchema);
