// scripts/smoke-secrets.mjs — bws secret-injection smoke test.
// Prints each requested env var's NAME and length only — NEVER the value.
// Run THROUGH the wrapper, key names passed as ARGV (argv survives minimal
// mode's `env -i`; env vars would be stripped):
//   BWS_ENV_MODE=minimal ./scripts/bws-exec.sh node scripts/smoke-secrets.mjs KEY1 KEY2 ...
// Exit: 0 = all set, 1 = one+ MISSING, 2 = no keys given.
const keys = process.argv.slice(2);
if (!keys.length) { console.error("usage: smoke-secrets.mjs KEY [KEY...]"); process.exit(2); }
let missing = 0;
for (const k of keys) {
  const v = process.env[k];
  if (v && v.length) console.log(`${k}: set (len=${v.length})`);
  else { console.log(`${k}: MISSING`); missing++; }
}
process.exit(missing ? 1 : 0);
