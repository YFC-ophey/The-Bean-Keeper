export interface UserNotionAuthState {
  userId: string;
  accessToken: string;
  databaseId: string;
  workspaceName?: string;
  isOwner?: boolean;
  updatedAt: string;
}

const notionAuthState = new Map<string, UserNotionAuthState>();

export function saveUserNotionAuthState(state: Omit<UserNotionAuthState, 'updatedAt'>): UserNotionAuthState {
  const finalState: UserNotionAuthState = {
    ...state,
    updatedAt: new Date().toISOString(),
  };
  notionAuthState.set(state.userId, finalState);
  return finalState;
}

export function getUserNotionAuthState(userId: string): UserNotionAuthState | null {
  return notionAuthState.get(userId) ?? null;
}

export function clearUserNotionAuthState(userId: string): void {
  notionAuthState.delete(userId);
}
