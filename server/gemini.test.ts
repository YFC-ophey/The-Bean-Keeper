import assert from "node:assert/strict";
import { test } from "node:test";
import { extractCoffeeInfoFromPhotos, GeminiScanError, MAX_GEMINI_IMAGE_BYTES } from "./gemini";

const front = { buffer: Buffer.from("front photo"), mimetype: "image/jpeg" };
const back = { buffer: Buffer.from("back photo"), mimetype: "image/png" };

test("Gemini receives both photos and returns only supported coffee fields", async () => {
  let request: Request | undefined;
  const fakeFetch: typeof fetch = async (input, init) => {
    request = new Request(input, init);
    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify({
        roasterName: "  Bean House  ",
        origin: "Ethiopia",
        roastLevel: "Light",
        flavorNotes: [" citrus ", "berry", 42],
        inventedField: "ignored",
      }) }] } }],
    }), { status: 200 });
  };

  const extracted = await extractCoffeeInfoFromPhotos(front, back, "test-key", fakeFetch);
  assert.deepEqual(extracted, {
    roasterName: "Bean House",
    origin: "Ethiopia",
    roastLevel: "Light",
    flavorNotes: ["citrus", "berry"],
  });
  assert.equal(request?.headers.get("x-goog-api-key"), "test-key");
  const body = await request?.json() as { contents: Array<{ parts: Array<{ inlineData?: { mimeType: string; data: string } }> }> };
  assert.equal(body.contents[0].parts.length, 3);
  assert.equal(body.contents[0].parts[1].inlineData?.mimeType, "image/jpeg");
  assert.equal(body.contents[0].parts[2].inlineData?.mimeType, "image/png");
  assert.equal(Buffer.from(body.contents[0].parts[1].inlineData!.data, "base64").toString(), "front photo");
});

test("Gemini trial rejects photos above its inline request budget", async () => {
  const huge = { buffer: Buffer.alloc(MAX_GEMINI_IMAGE_BYTES + 1), mimetype: "image/jpeg" };
  await assert.rejects(
    extractCoffeeInfoFromPhotos(huge, undefined, "test-key", async () => { throw new Error("Must not call API"); }),
    (error) => error instanceof GeminiScanError && error.status === 413,
  );
});

test("Gemini quota errors produce an actionable status without provider details", async () => {
  await assert.rejects(
    extractCoffeeInfoFromPhotos(front, undefined, "test-key", async () => new Response("secret provider details", { status: 429 })),
    (error) => error instanceof GeminiScanError && error.status === 429 && !error.message.includes("secret"),
  );
});

test("Gemini reports an upstream timeout while waiting for a response", async () => {
  const stalledFetch: typeof fetch = async (_input, init) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
  });
  await assert.rejects(
    extractCoffeeInfoFromPhotos(front, undefined, "test-key", stalledFetch, 10),
    (error) => error instanceof GeminiScanError && error.status === 504 && error.message.includes("too long"),
  );
});

test("Gemini reports an upstream timeout while reading a response", async () => {
  const stalledBody: typeof fetch = async (_input, init) => ({
    ok: true,
    json: () => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
    }),
  }) as Response;
  await assert.rejects(
    extractCoffeeInfoFromPhotos(front, undefined, "test-key", stalledBody, 10),
    (error) => error instanceof GeminiScanError && error.status === 504 && error.message.includes("too long"),
  );
});
