import session from 'express-session';
import createMemoryStore from 'memorystore';

const MemoryStore = createMemoryStore(session);

export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-me-in-production',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStore({
    checkPeriod: 86400000, // Prune expired entries every 24 hours
  }),
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true, // Prevent XSS attacks
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax', // CSRF protection
  },
});

// Type augmentation for express-session
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    accessToken?: string;
    databaseId?: string;
    workspaceName?: string;
  }
}
