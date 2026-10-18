import assert from "node:assert/strict";
import { test } from "node:test";
import { applyScanValues, clearAutoFilledValues } from "./coffeeScan";

test("photo replacement clears unchanged scanned values and preserves manual edits", () => {
  const initial = { roasterName: "", origin: "", farm: "Manual Farm" };
  const first = applyScanValues(initial, {
    roasterName: "First Roaster",
    origin: "Ethiopia",
    farm: "Scanned Farm",
    variety: "Unknown field",
    roastLevel: undefined,
  });
  assert.deepEqual(first.form, {
    roasterName: "First Roaster",
    origin: "Ethiopia",
    farm: "Manual Farm",
  });
  assert.deepEqual(first.autoFilled, {
    roasterName: "First Roaster",
    origin: "Ethiopia",
  });

  const userEdited = { ...first.form, origin: "Kenya" };
  const replaced = clearAutoFilledValues(userEdited, first.autoFilled);
  assert.deepEqual(replaced, {
    roasterName: "",
    origin: "Kenya",
    farm: "Manual Farm",
  });

  const second = applyScanValues(replaced, {
    roasterName: "Second Roaster",
    origin: "Colombia",
    farm: "New Scanned Farm",
  });
  assert.deepEqual(second.form, {
    roasterName: "Second Roaster",
    origin: "Kenya",
    farm: "Manual Farm",
  });
  assert.deepEqual(second.autoFilled, { roasterName: "Second Roaster" });
});
