// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const Service = require('../models/Service');
const mongoose = require('mongoose');

router.post('/create-checkout-session', requireAuth, async (req, res) => {
  const { serviceId } = req.body;

  try {
    if (!mongoose.isObjectIdOrHexString(serviceId)) {
      return res.status(400).json({ error: 'Invalid service ID' });
    }
    const service = await Service.findOne({ _id: serviceId, bookedBy: req.user._id });
    if (!service) return res.status(404).json({ error: 'Service not found' });
    const amount = Math.round(Number(service.price) * 100);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid service price' });
    }
    if (!process.env.STRIPE_SECRET_KEY || !process.env.CLIENT_URL) {
      return res.status(503).json({ error: 'Payments are not configured' });
    }
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'BDT',
            product_data: {
              name: 'Service Payment',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/services`, // Update to your client URL
      cancel_url: `${process.env.CLIENT_URL}/orders`, // Update to your client URL
    });

    res.json({ id: session.id });
  } catch (error) {
    res.status(500).json({ error: 'Unable to create checkout session' });
  }
});

module.exports = router;
