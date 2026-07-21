import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'
import type { NextFunction, Request, Response } from 'express'

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
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
    if(!process.env.JWT_SECRET) {
      throw new Error('JWT is not defined in environment variables');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (typeof decoded === 'string' || typeof decoded.userId !== 'string') {
      throw new JsonWebTokenError('Invalid token payload')
    }

    req.userId = decoded.userId

    next()
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Access token expired',
      })
    }

    if (error instanceof JsonWebTokenError) {
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
