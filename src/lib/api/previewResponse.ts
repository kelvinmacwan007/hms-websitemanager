/** Require a preview token and keep transport failures readable in the editor. */
export async function readPreviewResponse(response: Response): Promise<{ token: string }> {
  const unavailable = "Preview could not load. Please retry.";
  const signIn = "Your Website Studio session has expired. Sign in again to continue.";
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new Error([401, 403, 404].includes(response.status) ? signIn : unavailable);
  }
  if (!response.ok) {
    const message =
      result && typeof result === "object" && "error" in result && typeof result.error === "string"
        ? result.error
        : response.status === 401
          ? signIn
          : unavailable;
    throw new Error(message);
  }
  if (
    !result ||
    typeof result !== "object" ||
    !("token" in result) ||
    typeof result.token !== "string" ||
    !result.token.trim()
  )
    throw new Error(unavailable);
  return { token: result.token };
}
