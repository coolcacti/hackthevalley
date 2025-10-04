import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  userAuth0Id: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  compost: {
    type: Number,
    default: 0,
  },
  recycle: {
    type: Number,
    default: 0,
  },
  trash: {
    type: Number,
    default: 0,
  },
  totalItems: {
    type: Number,
    default: 0,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

submissionSchema.pre('save', function (next) {
  this.totalItems = (this.compost || 0) + (this.recycle || 0) + (this.trash || 0);
  next();
});

submissionSchema.index({ location: '2dsphere' });

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;