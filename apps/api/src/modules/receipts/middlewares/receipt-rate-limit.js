const rateLimit = require('express-rate-limit');

const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: 'Too many uploads, try again later' }
})

module.exports = uploadRateLimit