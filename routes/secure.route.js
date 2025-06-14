const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate.middleware');
const authorize = require('../middleware/authorize.middleware');

router.get('/secure', authenticate, (req, res) => {
  res.status(200).json({ message: 'Authenticated' });
});

router.get('/admin', authenticate, authorize(['admin']), (req, res) => {
  res.status(200).json({ message: 'Admin access' });
});

module.exports = router;
