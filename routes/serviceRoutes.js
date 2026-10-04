const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { requireAuth } = require('../middleware/authMiddleware');

// Create service route
router.post('/services', requireAuth, serviceController.createService);

// Get services for user route
router.get('/services', requireAuth, serviceController.getUserServices);

router.delete('/services/:serviceId', requireAuth, serviceController.deleteService);

module.exports = router;
