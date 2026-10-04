// userServiceController.js
const User = require('../models/User');
const Service = require('../models/Service');

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Also delete services associated with this user
    await Service.deleteMany({ bookedBy: userId });
    res.status(200).json({ message: 'User and associated services deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const serviceId = req.params.serviceId;
    const deletedService = await Service.findByIdAndDelete(serviceId);
    if (!deletedService) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.status(200).json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};
