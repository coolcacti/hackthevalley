import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userAuth0Id: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
  picture: { type: String, default: "/avatar1.jpeg" },
  compost: { type: Number, default: 0 },
  recycle: { type: Number, default: 0 },
  trash: { type: Number, default: 0 },
  totalItemsCollected: { type: Number, default: 0 },
  locations: { 
    type: [
      {
        latitude: { type: Number },
        longitude: { type: Number },
        timestamp: { type: Date, default: Date.now },
        successfulDeposit: { type: Boolean, default: false }
      }
    ], 
    default: []
  },
});

const User = mongoose.model('User', userSchema);

export default User;