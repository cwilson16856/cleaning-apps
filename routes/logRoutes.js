// routes/logRoutes.js
const express = require('express');
const router = express.Router();
const logger = require('../logger');

router.post('/', (req, res) => {
  const { level, message } = req.body;
  if (level && message) {
    logger.log({ level, message });
    res.status(200).send('Log received');
  } else {
    res.status(400).send('Invalid log data');
  }
});

module.exports = router;
