import { randomBytes, scryptSync } from "node:crypto";
const username = process.argv[2],
  tenantId = process.argv[3];
if (
  !/^[a-zA-Z0-9_.@-]{1,100}$/.test(username || "") ||
  !/^[a-zA-Z0-9_-]{1,100}$/.test(tenantId || "")
)
  throw new Error(
    "Usage: node scripts/create-manager-user.mjs USERNAME TENANT_ID (optionally set MANAGER_PASSWORD)",
  );
const password = process.env.MANAGER_PASSWORD || randomBytes(18).toString("base64url");
if (password.length < 12 || password.length > 256)
  throw new Error("Use a password between 12 and 256 characters.");
const salt = randomBytes(16).toString("hex");
const passwordHash = `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
console.log("WEBSITE_MANAGER_USERS_JSON=" + JSON.stringify([{ username, passwordHash, tenantId }]));
if (!process.env.MANAGER_PASSWORD)
  console.log("Generated login password (store privately): " + password);
console.log(
  "New session secret (use only for first setup or session rotation): " +
    randomBytes(32).toString("hex"),
);
