import assert from "node:assert/strict";
import test from "node:test";
import Groq from "groq-sdk";

test("coffee extraction requests a supported JSON model and normalizes its response", async () => {
  const previousKey = process.env.GROQ_API_KEY;
  const previousCreate = Groq.Chat.Completions.prototype.create;
  process.env.GROQ_API_KEY = "test-only-key";

  let request: Record<string, unknown> | undefined;
  Groq.Chat.Completions.prototype.create = (async (body: Record<string, unknown>) => {
    request = body;
    return { choices: [{ message: { content: JSON.stringify({
      roasterName: "  Happy Goat  ",
      origin: " Colombia , Ethiopia ",
      flavorNotes: [" citrus ", "", 42],
    }) } }] };
  }) as typeof previousCreate;

  try {
    const { extractCoffeeInfoWithAI } = await import("./groq.js");
    const result = await extractCoffeeInfoWithAI("Happy Goat Colombia Ethiopia citrus");

    assert.equal(request?.model, "openai/gpt-oss-20b");
    assert.deepEqual(request?.response_format, { type: "json_object" });
    assert.equal(request?.reasoning_effort, "low");
    assert.deepEqual(result, {
      roasterName: "Happy Goat",
      origin: "Colombia, Ethiopia",
      flavorNotes: ["citrus"],
    });
  } finally {
    Groq.Chat.Completions.prototype.create = previousCreate;
    if (previousKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = previousKey;
  }
});
