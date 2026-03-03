import { Request, Response, NextFunction } from 'express';
import { getUserNotionAuthState, type UserNotionAuthState } from '../notion-auth-state';
import { verifySupabaseAccessToken } from '../supabase';

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

async function hydrateAuthFromBearerToken(req: Request): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return;
  }

  const accessToken = header.slice('Bearer '.length).trim();
  if (!accessToken) {
    return;
  }

  const user = await verifySupabaseAccessToken(accessToken);
  if (!user) {
    return;
  }

  req.authUser = { id: user.id, email: user.email };
  req.notionAuthState = getUserNotionAuthState(user.id) ?? undefined;
}

/**
 * Authentication middleware that requires a valid Supabase user session.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  await hydrateAuthFromBearerToken(req);

  if (!req.authUser && req.session.accessToken && req.session.databaseId) {
    req.notionAuthState = {
      userId: req.session.userId || "legacy-session",
      accessToken: req.session.accessToken,
      databaseId: req.session.databaseId,
      workspaceName: req.session.workspaceName,
      isOwner: req.session.isOwner || false,
      updatedAt: new Date().toISOString(),
    };
  }

  if (!req.authUser && !req.notionAuthState) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Please sign in to access this resource',
    });
  }

  next();
}

/**
 * Optional authentication middleware
 * Passes through regardless of auth status and hydrates auth metadata when available.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  await hydrateAuthFromBearerToken(req);
  next();
}
