import { Request, Response, NextFunction } from 'express';
import { getUserNotionAuthState, saveUserNotionAuthState, type UserNotionAuthState } from '../notion-auth-state';
import { loadNotionConnectionFromSupabase, verifySupabaseAccessToken } from '../supabase';

interface AuthenticatedUser {
  id: string;
  email?: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    authUser?: AuthenticatedUser;
    notionAuthState?: UserNotionAuthState;
  }
}

async function hydrateAuthFromBearerToken(req: Request): Promise<boolean> {
  const header = req.headers.authorization;
  if (header === undefined) {
    return true;
  }

  const match = /^Bearer\s+([^\s]+)$/i.exec(header.trim());
  if (!match) {
    return false;
  }

  const user = await verifySupabaseAccessToken(match[1]);
  if (!user) {
    return false;
  }

  req.authUser = { id: user.id, email: user.email };
  let notionState = getUserNotionAuthState(user.id);
  if (!notionState) {
    const persisted = await loadNotionConnectionFromSupabase(user.id);
    if (persisted) {
      notionState = saveUserNotionAuthState({
        userId: persisted.userId,
        accessToken: persisted.accessToken,
        databaseId: persisted.databaseId,
        workspaceName: persisted.workspaceName,
        isOwner: persisted.isOwner,
      });
    }
  }
  req.notionAuthState = notionState ?? undefined;
  return true;
}

/**
 * Authentication middleware that requires a valid Supabase user session.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const valid = await hydrateAuthFromBearerToken(req);
    if (!valid || !req.authUser) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Please sign in to access this resource',
      });
    }
    next();
  } catch (error) {
    console.error('Authentication backend error:', error);
    return res.status(503).json({ error: 'Authentication temporarily unavailable' });
  }
}

/**
 * Optional authentication middleware
 * Passes through regardless of auth status and hydrates auth metadata when available.
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    if (!await hydrateAuthFromBearerToken(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  } catch (error) {
    console.error('Authentication backend error:', error);
    return res.status(503).json({ error: 'Authentication temporarily unavailable' });
  }
}
