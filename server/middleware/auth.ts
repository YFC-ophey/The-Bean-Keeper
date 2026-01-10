import { Request, Response, NextFunction } from 'express';

/**
 * Authentication middleware that requires user to be logged in
 * Checks for valid session with accessToken and databaseId
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.accessToken || !req.session.databaseId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Please log in with Notion to access this resource'
    });
  }
  next();
}

/**
 * Optional authentication middleware
 * Passes through regardless of auth status, but attaches user info if available
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  // No-op middleware - passes through but allows checking req.session
  next();
}
