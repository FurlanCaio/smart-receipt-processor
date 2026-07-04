const jwt = require('jsonwebtoken')

function ensureAuthenticated(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      code: 'AUTH_HEADER_MISSING',
      message: 'Authorization header is missing',
    })
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.userId = decoded.userId



    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Access token expired',
      })
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        code: 'INVALID_TOKEN',
        message: 'Invalid token',
      })
    }

    return res.status(401).json({
      success: false,
      code: 'AUTHENTICATION_FAILED',
      message: 'Authentication failed',
    })
  }
}

module.exports = { ensureAuthenticated }