import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { scanPhotosWithGemini, setAuthToken, uploadFile } from "./queryClient";

const originalFetch = globalThis.fetch;
const uploadPath = "/api/cloudinary-upload/123e4567-e89b-42d3-a456-426614174000";
const localUploadPath = "/api/local-upload/123e4567-e89b-42d3-a456-426614174000";

afterEach(() => {
  globalThis.fetch = originalFetch;
  setAuthToken(null);
});

test("photo upload sends binary data with the current bearer token", async () => {
  const file = new File(["photo bytes"], "coffee.jpeg", { type: "image/jpeg" });
  setAuthToken("test-token");
  globalThis.fetch = async (url, options) => {
    assert.equal(url, uploadPath);
    assert.equal(options?.method, "PUT");
    assert.equal(options?.redirect, "error");
    assert.equal(new Headers(options?.headers).get("Authorization"), "Bearer test-token");
    assert.equal(new Headers(options?.headers).get("Content-Type"), "image/jpeg");
    assert.equal(options?.body, file);
    return Response.json({ url: "https://example.com/coffee.jpeg" });
  };

  assert.equal(
    await uploadFile(uploadPath, file),
    "https://example.com/coffee.jpeg",
  );
});

test("photo upload rejects errors and responses without a URL", async () => {
  const file = new File(["photo bytes"], "coffee.jpeg", { type: "image/jpeg" });
  globalThis.fetch = async () => Response.json({ error: "Unauthorized" }, { status: 401 });
  await assert.rejects(uploadFile(localUploadPath, file), /401/);

  globalThis.fetch = async () => Response.json({ error: "Missing URL" });
  await assert.rejects(uploadFile(localUploadPath, file), /did not return a photo URL/);
});

test("photo upload refuses external or unexpected URLs before sending a token", async () => {
  const file = new File(["photo bytes"], "coffee.jpeg", { type: "image/jpeg" });
  setAuthToken("test-token");
  globalThis.fetch = async () => {
    throw new Error("fetch must not be called");
  };

  for (const url of [
    "https://evil.example/api/cloudinary-upload/123e4567-e89b-42d3-a456-426614174000",
    "//evil.example/api/cloudinary-upload/123e4567-e89b-42d3-a456-426614174000",
    "/api/coffee-entries",
    `${uploadPath}?redirect=https://evil.example`,
  ]) {
    await assert.rejects(uploadFile(url, file), /Unexpected photo upload URL/);
  }
});

test("Gemini sends both photos with bearer auth and no exposed API key", async () => {
  const front = new File(["front"], "front.jpg", { type: "image/jpeg" });
  const back = new File(["back"], "back.png", { type: "image/png" });
  setAuthToken("test-token");
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/scan-coffee-photos");
    assert.equal(options?.method, "POST");
    assert.equal(new Headers(options?.headers).get("Authorization"), "Bearer test-token");
    assert.equal(new Headers(options?.headers).get("Content-Type"), null);
    assert.deepEqual((options?.body as FormData).getAll("front"), [front]);
    assert.deepEqual((options?.body as FormData).getAll("back"), [back]);
    return Response.json({ roasterName: "Bean House" });
  };
  const result = await scanPhotosWithGemini(front, back);
  assert.deepEqual(await result.json(), { roasterName: "Bean House" });
});
