import User from '../models/user.js';

export const createUser = async (req, res) => {
  try {
    const { userId, name, compost, recycle, trash, totalItemsCollected } = req.body;
    const newUser = new User({ userId, name, compost, recycle, trash, totalItemsCollected });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { compost, recycle, trash, totalItemsCollected, location } = req.body;
    let updateFields = { compost, recycle, trash, totalItemsCollected };

    if (location && typeof location === 'object') {
      updateFields = {
        ...updateFields,
        $push: {
          locations: {
            latitude: location.latitude,
            longitude: location.longitude,
            timestamp: new Date(),
            successfulDeposit: !!location.successfulDeposit
          }
        }
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ message: 'User not found' });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};