import { Request, Response, NextFunction } from 'express';
import { getUserNotionAuthState, saveUserNotionAuthState, type UserNotionAuthState } from '../notion-auth-state';
import { loadNotionConnectionFromSupabase, verifySupabaseAccessToken } from '../supabase';

interface AuthenticatedUser {
  id: string;
  email?: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class OwnerNotionConfigurationError extends Error {
  constructor() {
    super('Owner Notion configuration incomplete');
  }
}

function isConfiguredOwnerUser(userId: string): boolean {
  const ownerId = process.env.OWNER_SUPABASE_USER_ID?.trim();
  return !!ownerId && UUID_PATTERN.test(ownerId) && userId.toLowerCase() === ownerId.toLowerCase();
}

/** Owner access is bound to one verified Supabase identity and server-held Notion credentials. */
export function getOwnerNotionAuthState(userId: string): UserNotionAuthState | null {
  const accessToken = process.env.NOTION_API_KEY?.trim();
  const databaseId = process.env.NOTION_DATABASE_ID?.trim();
  if (!isConfiguredOwnerUser(userId) || !accessToken || !databaseId) {
    return null;
  }

  return {
    userId,
    accessToken,
    databaseId,
    workspaceName: 'Owner collection',
    isOwner: true,
    updatedAt: new Date().toISOString(),
  };
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
  const ownerState = getOwnerNotionAuthState(user.id);
  if (ownerState) {
    req.notionAuthState = ownerState;
    return true;
  }
  if (isConfiguredOwnerUser(user.id)) {
    throw new OwnerNotionConfigurationError();
  }

  let notionState = getUserNotionAuthState(user.id);
  if (!notionState) {
    const persisted = await loadNotionConnectionFromSupabase(user.id);
    if (persisted) {
      notionState = saveUserNotionAuthState({
        userId: persisted.userId,
        accessToken: persisted.accessToken,
        databaseId: persisted.databaseId,
        workspaceName: persisted.workspaceName,
        isOwner: false,
      });
    }
  }
  req.notionAuthState = notionState ? { ...notionState, isOwner: false } : undefined;
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
    if (error instanceof OwnerNotionConfigurationError) {
      return res.status(503).json({ error: error.message });
    }
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
    if (error instanceof OwnerNotionConfigurationError) {
      return res.status(503).json({ error: error.message });
    }
    console.error('Authentication backend error:', error);
    return res.status(503).json({ error: 'Authentication temporarily unavailable' });
  }
}
