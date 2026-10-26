import assert from "node:assert/strict";
import test from "node:test";
import { readPreviewResponse } from "../src/lib/api/previewResponse.ts";

test("preview handles empty, malformed and expired-session responses without exposing JSON errors", async () => {
  for (const response of [new Response(null, { status: 404 }), new Response(null, { status: 401 })])
    await assert.rejects(readPreviewResponse(response), /Sign in again/);
  for (const response of [
    new Response("<html>Error</html>", { status: 500 }),
    new Response(""),
    Response.json({}),
    Response.json(null),
  ])
    await assert.rejects(readPreviewResponse(response), /Preview could not load/);
  await assert.rejects(
    readPreviewResponse(Response.json({ error: "Preview access denied." }, { status: 403 })),
    /Preview access denied/,
  );
  assert.deepEqual(await readPreviewResponse(Response.json({ token: "preview-token" })), {
    token: "preview-token",
  });
});
