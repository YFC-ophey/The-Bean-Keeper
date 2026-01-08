import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), ".local", "uploads");

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create upload directory:", error);
  }
}

ensureUploadDir();

export class LocalStorageService {
  async getUploadURL(): Promise<string> {
    const fileId = randomUUID();
    // Return a URL that the frontend can use to upload
    return `/api/local-upload/${fileId}`;
  }

  async saveFile(fileId: string, buffer: Buffer, contentType: string): Promise<string> {
    const ext = contentType.split('/')[1] || 'jpg';
    const filename = `${fileId}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    await fs.writeFile(filePath, buffer);

    // Return the public URL
    return `/api/local-files/${filename}`;
  }

  async getFile(filename: string): Promise<Buffer> {
    const filePath = path.join(UPLOAD_DIR, filename);
    return await fs.readFile(filePath);
  }

  async fileExists(filename: string): Promise<boolean> {
    try {
      const filePath = path.join(UPLOAD_DIR, filename);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export const localStorageService = new LocalStorageService();
