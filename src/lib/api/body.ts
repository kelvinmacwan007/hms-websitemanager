/** Bound actual bytes while streaming, including requests without Content-Length. */
export async function readLimitedBytes(request: Request, maximum: number): Promise<Uint8Array> {
  if (Number(request.headers.get("content-length")) > maximum)
    throw new Error("Request too large.");
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maximum) {
        await reader.cancel();
        throw new Error("Request too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

export async function readLimitedText(request: Request, maximum: number) {
  return new TextDecoder("utf-8", { fatal: true }).decode(await readLimitedBytes(request, maximum));
}
