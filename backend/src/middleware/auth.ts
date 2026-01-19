import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { UserRole } from '../models/User';

export interface AuthRequest extends Request {
  user?: TokenPayload;
  body: any;
  params: any;
  query: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
};

export const authorize = (...roles: (UserRole | 'USER' | 'STATE_ADMIN' | 'SUPER_ADMIN')[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const authorizeStateAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const requestedStateCode = req.params.stateCode || req.body.stateCode;

  if (req.user.role === 'SUPER_ADMIN') {
    // Super admin can access all states
    next();
    return;
  }

  if (req.user.role === 'STATE_ADMIN' && req.user.stateCode === requestedStateCode) {
    // State admin can only access their state
    next();
    return;
  }

  res.status(403).json({ error: 'You do not have permission to access this state' });
};
