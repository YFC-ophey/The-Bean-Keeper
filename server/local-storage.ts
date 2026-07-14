import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), ".local", "uploads");
const SAFE_UPLOAD_FILENAME_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|heic|heif)$/i;
const CONTENT_TYPE_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

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
  isSafeUploadFilename(filename: string): boolean {
    return SAFE_UPLOAD_FILENAME_PATTERN.test(filename);
  }

  async getUploadURL(): Promise<string> {
    const fileId = randomUUID();
    // Return a URL that the frontend can use to upload
    return `/api/local-upload/${fileId}`;
  }

  async saveFile(fileId: string, buffer: Buffer, contentType: string): Promise<string> {
    const ext = CONTENT_TYPE_TO_EXTENSION[contentType.toLowerCase()];
    if (!ext) {
      throw new Error("Unsupported content type");
    }
    const filename = `${fileId}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    await fs.writeFile(filePath, buffer);

    // Return the public URL
    return `/api/local-files/${filename}`;
  }

  async getFile(filename: string): Promise<Buffer> {
    if (!this.isSafeUploadFilename(filename)) {
      throw new Error("Invalid filename");
    }
    const filePath = path.join(UPLOAD_DIR, filename);
    return await fs.readFile(filePath);
  }

  async fileExists(filename: string): Promise<boolean> {
    if (!this.isSafeUploadFilename(filename)) {
      return false;
    }
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
