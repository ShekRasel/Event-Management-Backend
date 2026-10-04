const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuthController');
const adminController = require('../controllers/adminController');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');
const multer = require('multer');
const path = require('path');
const Contact = require('../models/Contact');



// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Admin Signup route with file upload
router.post('/signup', protectAdmin, upload.single('profilePhoto'), adminAuthController.adminSignup);

router.post('/signin', adminAuthController.adminSignin);

// Admin-only routes
router.get('/users', protectAdmin, adminController.getUsers);
router.get('/services', protectAdmin, adminController.getServices);
router.get('/profile', protectAdmin, adminController.getAdminProfile);
router.delete('/users/:userId', protectAdmin, adminController.deleteUser);
router.delete('/services/:serviceId', protectAdmin, adminController.deleteService);

router.get('/contacts', protectAdmin, async (req, res) => {
  try {
    const contacts = await Contact.find();
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching contacts' });
  }
});

// DELETE a contact by ID
router.delete('/contacts/:contactId', protectAdmin, async (req, res) => {
  try {
    const { contactId } = req.params;
    await Contact.findByIdAndDelete(contactId);
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while deleting the contact' });
  }
});


module.exports = router;
