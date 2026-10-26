export function isMockMode(): boolean {
  return (
    process.env.WEBSITE_ENV === "mock" ||
    (!process.env.WEBSITE_ENV && process.env.NODE_ENV !== "production")
  );
}
