// Creates a local .env from .env.example with a generated APP_SECRET.
// Usage: node scripts/make-local-env.cjs   (does nothing if .env exists)
const fs = require("fs");
const crypto = require("crypto");
if (fs.existsSync(".env")) {
  console.log(".env already exists; leaving it untouched.");
  process.exit(0);
}
let s = fs.readFileSync(".env.example", "utf8");
s = s.replace('APP_SECRET=""', 'APP_SECRET="' + crypto.randomBytes(32).toString("base64url") + '"');
fs.writeFileSync(".env", s);
console.log("Wrote .env with a generated APP_SECRET. Add your Supabase keys next (see README, Member portal).");
