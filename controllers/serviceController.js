const Service = require('../models/Service');
const User = require('../models/User');

// Create service for a user
exports.createService = async (req, res) => {
  try {
    const userId = req.user._id; // Use _id instead of id

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const newService = new Service({
      ...req.body,
      bookedBy: userId
    });

    const savedService = await newService.save();
    res.status(201).json(savedService);
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

// Get services for user
exports.getUserServices = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const services = await Service.find({ bookedBy: userId });
    res.status(200).json(services);
  } catch (error) {
    console.error('Get user services error:', error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const serviceId = req.params.serviceId;
    if (!require('mongoose').isObjectIdOrHexString(serviceId)) {
      return res.status(400).json({ message: 'Invalid service ID' });
    }
    const deletedService = await Service.findOneAndDelete({
      _id: serviceId,
      bookedBy: req.user._id
    });
    if (!deletedService) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};
