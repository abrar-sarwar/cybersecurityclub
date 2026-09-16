// Creates a local .env from .env.example with a generated AUTH_SECRET.
// Usage: node scripts/make-local-env.cjs   (does nothing if .env exists)
const fs = require("fs");
const crypto = require("crypto");
if (fs.existsSync(".env")) {
  console.log(".env already exists; leaving it untouched.");
  process.exit(0);
}
let s = fs.readFileSync(".env.example", "utf8");
s = s.replace('AUTH_SECRET=""', 'AUTH_SECRET="' + crypto.randomBytes(32).toString("base64") + '"');
s = s.replace('INITIAL_ADMIN_EMAILS=""', 'INITIAL_ADMIN_EMAILS="admin@example.edu"');
fs.writeFileSync(".env", s);
console.log("Wrote .env with a generated AUTH_SECRET and INITIAL_ADMIN_EMAILS=admin@example.edu");
