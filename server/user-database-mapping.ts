import fs from 'fs';
import path from 'path';

const MAPPING_FILE = path.join(process.cwd(), '.data', 'user-databases.json');

interface UserDatabaseMapping {
  [workspaceId: string]: {
    databaseId: string;
    workspaceName?: string;
    createdAt: string;
    lastAccessedAt: string;
  };
}

/**
 * Ensure .data directory exists
 */
function ensureDataDir(): void {
  const dataDir = path.dirname(MAPPING_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

/**
 * Load mappings from file
 */
function loadMappings(): UserDatabaseMapping {
  ensureDataDir();
  if (!fs.existsSync(MAPPING_FILE)) {
    return {};
  }
  try {
    const data = fs.readFileSync(MAPPING_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.warn('Failed to load user database mappings:', error);
    return {};
  }
}

/**
 * Save mappings to file
 */
function saveMappings(mappings: UserDatabaseMapping): void {
  ensureDataDir();
  fs.writeFileSync(MAPPING_FILE, JSON.stringify(mappings, null, 2));
}

/**
 * Get database ID for a workspace
 * Returns null if no mapping exists
 */
export function getDatabaseIdForWorkspace(workspaceId: string): string | null {
  const mappings = loadMappings();
  const entry = mappings[workspaceId];
  if (entry) {
    // Update last accessed time
    entry.lastAccessedAt = new Date().toISOString();
    saveMappings(mappings);
    console.log(`📖 Retrieved database mapping for workspace ${workspaceId}: ${entry.databaseId}`);
    return entry.databaseId;
  }
  console.log(`📖 No database mapping found for workspace ${workspaceId}`);
  return null;
}

/**
 * Save database ID for a workspace
 * Creates new mapping or updates existing one
 */
export function saveDatabaseIdForWorkspace(
  workspaceId: string,
  databaseId: string,
  workspaceName?: string
): void {
  const mappings = loadMappings();
  const now = new Date().toISOString();

  mappings[workspaceId] = {
    databaseId,
    workspaceName,
    createdAt: mappings[workspaceId]?.createdAt || now,
    lastAccessedAt: now,
  };

  saveMappings(mappings);
  console.log(`💾 Saved database mapping: workspace ${workspaceId} → database ${databaseId}`);
}

/**
 * Delete mapping for a workspace (useful for testing/cleanup)
 */
export function deleteDatabaseMappingForWorkspace(workspaceId: string): boolean {
  const mappings = loadMappings();
  if (mappings[workspaceId]) {
    delete mappings[workspaceId];
    saveMappings(mappings);
    console.log(`🗑️ Deleted database mapping for workspace ${workspaceId}`);
    return true;
  }
  return false;
}

/**
 * Get all mappings (for debugging)
 */
export function getAllMappings(): UserDatabaseMapping {
  return loadMappings();
}
